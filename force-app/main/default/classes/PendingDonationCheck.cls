/**
 * Applies the payment gateway's status to pending donations the thank-you page never confirmed (US-03 AC5 and
 * refinement 2): the donor paid and closed the browser, or never paid and the session expired. Scheduled every
 * 15 minutes (scheduleEveryQuarterHour) by the integration user that holds "Donaciones · Payment Integration" and
 * access to the Stripe credential: only that user can change a donation's status. Donations it marks paid get
 * their receipt from DonationTrigger.
 */
public without sharing class PendingDonationCheck implements Queueable, Database.AllowsCallouts {

    @TestVisible
    private static final String JOB_NAME = 'Donaciones pendientes';
    // Gives the donor time to come back to the thank-you page before the check asks the gateway.
    private static final Integer GRACE_MINUTES = 5;
    // ponytail: one callout per donation and Salesforce allows 100 per transaction, so 100 per run (400 an hour).
    private static final Integer MAX_PER_RUN = 100;

    /**
     * @description Schedules the check at minutes 00, 15, 30 and 45 of every hour. Run it once as the integration user.
     */
    @SuppressWarnings('PMD.OperationWithLimitsInLoop') // four fixed iterations, one per quarter hour
    public static void scheduleEveryQuarterHour() {
        for (Integer minute = 0; minute < 60; minute += 15) {
            String name = JOB_NAME + ' :' + String.valueOf(minute).leftPad(2, '0');
            System.schedule(name, '0 ' + minute + ' * * * ?', new ScheduledRun());
        }
    }

    /**
     * @description Asks the gateway about each pending donation older than the grace period and saves its status.
     * @param context the queued job
     */
    public void execute(QueueableContext context) {
        List<Opportunity> pending = [
            SELECT Id, StageName, Stripe_Session_Id__c
            FROM Opportunity
            WHERE StageName = 'Pending'
                AND Stripe_Session_Id__c != NULL
                AND CreatedDate <= :Datetime.now().addMinutes(-GRACE_MINUTES)
            WITH SYSTEM_MODE
            ORDER BY CreatedDate
            LIMIT :MAX_PER_RUN
        ];
        if (!pending.isEmpty()) {
            DonationCheckoutService.applyGatewayStatus(pending, 'Scheduled_Check');
        }
    }

    /**
     * @description The scheduled run. Scheduled Apex can't call out, and a Queueable can't also be Schedulable,
     * so this class only queues the check.
     */
    public class ScheduledRun implements Schedulable {
        /**
         * @description Queues the check.
         * @param context the schedule
         */
        public void execute(SchedulableContext context) {
            System.enqueueJob(new PendingDonationCheck());
        }
    }
}
