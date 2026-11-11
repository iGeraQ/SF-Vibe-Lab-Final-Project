/**
 * Sends the donor's receipt, in Spanish, once, when a donation becomes paid (US-14 AC2 to AC6, #44). Stripe sends no
 * receipts in test mode. DonationEmailTemplate writes the email; this class decides when and to whom it goes. The sender and the support email (US-11 AC6) are the Org-Wide Email Address named
 * SENDER_NAME, set up in Setup so no address lives in the repo. Runs in the context that confirmed the payment
 * (the site guest user or the integration user), so it reads in system mode. When the donor asked for an invoice,
 * the same email carries a simulated invoice as a PDF (US-06 AC8): one email per donation, sent once.
 */
public without sharing class DonationReceiptService {

    @TestVisible
    private static final String SENDER_NAME = 'Donaciones Mexico Dreamin';

    /**
     * @description Called by DonationTrigger. Before update it flags the donations that just became paid, so each
     * receipt is sent only once; after update it sends the flagged receipts.
     * @param operation Trigger.operationType
     * @param donations Trigger.new
     * @param oldDonations Trigger.oldMap
     */
    public static void onUpdate(
        System.TriggerOperation operation,
        List<Opportunity> donations,
        Map<Id, Opportunity> oldDonations
    ) {
        if (operation == System.TriggerOperation.BEFORE_UPDATE) {
            markReceiptsToSend(donations, oldDonations);
        } else if (operation == System.TriggerOperation.AFTER_UPDATE) {
            sendReceipts(donations, oldDonations);
        }
    }

    private static void markReceiptsToSend(List<Opportunity> donations, Map<Id, Opportunity> oldDonations) {
        for (Opportunity donation : donations) {
            Boolean justPaid = donation.StageName == 'Paid' && oldDonations.get(donation.Id).StageName != 'Paid';
            if (justPaid && !donation.Receipt_Sent__c && String.isNotBlank(donation.Donor_Email__c)) {
                donation.Receipt_Sent__c = true;
            }
        }
    }

    // A failed send never undoes the payment: the flag goes back to false so staff can see the receipt was not sent.
    private static void sendReceipts(List<Opportunity> donations, Map<Id, Opportunity> oldDonations) {
        Set<Id> flagged = new Set<Id>();
        for (Opportunity donation : donations) {
            if (donation.Receipt_Sent__c && !oldDonations.get(donation.Id).Receipt_Sent__c) {
                flagged.add(donation.Id);
            }
        }
        if (flagged.isEmpty()) {
            return;
        }

        List<Opportunity> unsent = send(loadDonations(flagged));
        if (!unsent.isEmpty()) {
            update as system unsent;
        }
    }

    private static List<Opportunity> send(List<Opportunity> toSend) {
        OrgWideEmailAddress sender = sender();
        List<Messaging.SingleEmailMessage> emails = new List<Messaging.SingleEmailMessage>();
        for (Opportunity donation : toSend) {
            emails.add(buildReceipt(donation, sender));
        }

        List<Opportunity> unsent = new List<Opportunity>();
        try {
            List<Messaging.SendEmailResult> results = Messaging.sendEmail(emails, false);
            for (Integer i = 0; i < results.size(); i++) {
                if (!results[i].isSuccess()) {
                    unsent.add(new Opportunity(Id = toSend[i].Id, Receipt_Sent__c = false));
                }
            }
        } catch (EmailException e) {
            for (Opportunity donation : toSend) {
                unsent.add(new Opportunity(Id = donation.Id, Receipt_Sent__c = false));
            }
        }
        return unsent;
    }

    @TestVisible
    private static List<Opportunity> loadDonations(Set<Id> ids) {
        return [
            SELECT Id, Donation_Reference__c, Donor_Email__c, Amount, CloseDate, Donation_Type__c, Is_Anonymous__c,
                Donor_First_Name__c, Donor_Last_Name__c, Donor_Company__c, Campaign.Name, Invoice_Requested__c, RFC__c,
                toLabel(Person_Type__c)
            FROM Opportunity
            WHERE Id IN :ids
            WITH SYSTEM_MODE
        ];
    }

    // The wording and the look live in DonationEmailTemplate; this only puts the email together.
    @TestVisible
    private static Messaging.SingleEmailMessage buildReceipt(Opportunity donation, OrgWideEmailAddress sender) {
        String supportEmail = sender?.Address;
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new List<String>{ donation.Donor_Email__c });
        email.setSubject(DonationEmailTemplate.subject(donation));
        email.setHtmlBody(DonationEmailTemplate.receiptHtml(donation, supportEmail));
        email.setPlainTextBody(DonationEmailTemplate.receiptText(donation, supportEmail));
        email.setSaveAsActivity(false);
        if (sender?.Id != null) {
            email.setOrgWideEmailAddressId(sender.Id);
        }
        if (donation.Invoice_Requested__c) {
            email.setFileAttachments(new List<Messaging.EmailFileAttachment>{ invoicePdf(donation) });
        }
        return email;
    }

    private static Messaging.EmailFileAttachment invoicePdf(Opportunity donation) {
        Messaging.EmailFileAttachment pdf = new Messaging.EmailFileAttachment();
        pdf.setFileName(DonationEmailTemplate.invoiceFileName(donation));
        pdf.setContentType('application/pdf');
        pdf.setBody(Blob.toPdf(DonationEmailTemplate.invoiceHtml(donation)));
        return pdf;
    }

    // ponytail: no sender set up yet means the platform's default sender and no support line in the receipt.
    private static OrgWideEmailAddress sender() {
        List<OrgWideEmailAddress> senders = [
            SELECT Id, Address
            FROM OrgWideEmailAddress
            WHERE DisplayName = :SENDER_NAME
            WITH SYSTEM_MODE
            LIMIT 1
        ];
        return senders.isEmpty() ? null : senders[0];
    }
}
