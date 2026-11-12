@IsTest
private class PendingDonationCheckTest {

    private static List<String> askedSessions = new List<String>();

    // Answers like the gateway for known sessions and keeps the ids it was asked about.
    private class FakeGateway extends PaymentGateway {
        private final Map<String, PaymentGateway.CheckoutSession> sessions;

        FakeGateway(Map<String, PaymentGateway.CheckoutSession> sessions) {
            this.sessions = sessions;
        }

        /**
         * @description Not used by the check.
         * @param request unused
         * @return never returns
         */
        public override PaymentGateway.CheckoutSession createCheckoutSession(PaymentGateway.CheckoutRequest request) {
            throw new PaymentGateway.GatewayException('The check never creates sessions');
        }

        /**
         * @description Keeps the session id and answers with the canned session.
         * @param sessionId the session the check asked for
         * @return the canned session
         */
        public override PaymentGateway.CheckoutSession getCheckoutSession(String sessionId) {
            askedSessions.add(sessionId);
            if (!sessions.containsKey(sessionId)) {
                throw new PaymentGateway.GatewayException('Unknown session');
            }
            return sessions.get(sessionId);
        }
    }

    @TestSetup
    static void setup() {
        // Changing a donation's status needs the payment permission (Payment_Fields_Locked), as the integration user has.
        User integration = new User(
            ProfileId = UserInfo.getProfileId(),
            Username = 'revision.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Revisión',
            Email = 'revision@example.com',
            Alias = 'revision',
            TimeZoneSidKey = 'America/Merida',
            LocaleSidKey = 'es_MX',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'es',
            UserPermissionsMarketingUser = true // creating campaigns needs Marketing User, even from Apex
        );
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert integration;
            insert new PermissionSetAssignment(
                AssigneeId = integration.Id,
                PermissionSetId = [SELECT Id FROM PermissionSet WHERE Name = 'Donations_Payment_Integration'].Id
            );
        }

        System.runAs(integration) {
            Campaign campaign = new Campaign(
                Name = 'Becas 2026',
                StartDate = Date.today().addDays(-1),
                EndDate = Date.today().addDays(30),
                IsActive = true,
                ExpectedRevenue = 1000,
                Description = 'Campaña de prueba',
                Image_URL__c = 'https://example.com/campana.png',
                Purpose__c = 'Boletos para estudiantes'
            );
            // as system: the new fields have no field access on any profile until a permission set grants it.
            insert as system campaign;
            List<Opportunity> donations = new List<Opportunity>{
                pendingDonation(campaign.Id, 'cs_paid'),
                pendingDonation(campaign.Id, 'cs_expired'),
                pendingDonation(campaign.Id, 'cs_open'),
                pendingDonation(campaign.Id, 'cs_recent')
            };
            insert as system donations;
            // All but the last one were created before the grace period, so the donor is not coming back.
            for (Integer i = 0; i < 3; i++) {
                Test.setCreatedDate(donations[i].Id, Datetime.now().addMinutes(-30));
            }
        }
    }

    @IsTest
    static void checkAppliesTheGatewayStatus() {
        runCheck();

        Opportunity paid = donation('cs_paid');
        Assert.areEqual('Paid', paid.StageName, 'The donor paid and closed the browser (US-03 refinement 2)');
        Assert.areEqual(300, paid.Amount, 'The amount comes from the gateway');
        Assert.areEqual('Scheduled_Check', paid.Confirmation_Source__c);
        Assert.areEqual('Expired', donation('cs_expired').StageName, 'US-03 AC5');
        Assert.areEqual('Pending', donation('cs_open').StageName, 'An open session stays pending');
    }

    @IsTest
    static void checkLeavesRecentDonationsAlone() {
        runCheck();

        Assert.isFalse(askedSessions.contains('cs_recent'), 'The donor may still come back to the thank-you page');
        Assert.areEqual('Pending', donation('cs_recent').StageName);
    }

    @IsTest
    static void scheduledRunQueuesTheCheck() {
        // The queued check runs at stopTest; a gateway that knows no session keeps it away from real callouts.
        DonationCheckoutService.gateway = new FakeGateway(new Map<String, PaymentGateway.CheckoutSession>());
        Test.startTest();
        new PendingDonationCheck.ScheduledRun().execute(null);
        Integer queued = Limits.getQueueableJobs();
        Test.stopTest();

        Assert.areEqual(1, queued, 'Scheduled Apex cannot call out, so it queues the check');
    }

    @IsTest
    static void schedulingCreatesOneJobPerQuarterHour() {
        // Its own prefix: the org may already have the real jobs, and CronTrigger rows are visible to tests.
        PendingDonationCheck.scheduleEveryQuarterHour('Prueba de programacion');

        Assert.areEqual(4, [SELECT COUNT() FROM CronTrigger WHERE CronJobDetail.Name LIKE 'Prueba de programacion%']);
    }

    private static void runCheck() {
        DonationCheckoutService.gateway = new FakeGateway(new Map<String, PaymentGateway.CheckoutSession>{
            'cs_paid' => session(true, false),
            'cs_expired' => session(false, true),
            'cs_open' => session(false, false),
            'cs_recent' => session(true, false)
        });
        System.runAs(integrationUser()) {
            Test.startTest();
            System.enqueueJob(new PendingDonationCheck());
            Test.stopTest();
        }
    }

    private static PaymentGateway.CheckoutSession session(Boolean paid, Boolean expired) {
        PaymentGateway.CheckoutSession session = new PaymentGateway.CheckoutSession();
        session.paid = paid;
        session.expired = expired;
        session.amount = paid ? 300 : null;
        session.paymentId = paid ? 'pi_test' : null;
        return session;
    }

    private static Opportunity donation(String sessionId) {
        return [
            SELECT StageName, Amount, Confirmation_Source__c
            FROM Opportunity
            WHERE Stripe_Session_Id__c = :sessionId
            WITH SYSTEM_MODE
        ];
    }

    private static User integrationUser() {
        return [SELECT Id FROM User WHERE Username = :('revision.' + UserInfo.getOrganizationId() + '@example.com')];
    }

    private static Opportunity pendingDonation(Id campaignId, String sessionId) {
        return new Opportunity(
            Name = 'Donación ' + sessionId,
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            CampaignId = campaignId,
            StageName = 'Pending',
            Amount = 250,
            CloseDate = Date.today(),
            Donation_Reference__c = 'DON-' + sessionId.toUpperCase().remove('_'),
            Stripe_Session_Id__c = sessionId,
            Stripe_Session_Expires_At__c = Datetime.now().addMinutes(30),
            Donor_Email__c = 'donante@example.com',
            Is_Anonymous__c = true
        );
    }
}
