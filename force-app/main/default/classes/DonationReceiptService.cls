/**
 * Sends the donor's receipt, in Spanish, once, when a donation becomes paid (US-14 AC2 to AC6, #44). Stripe sends no
 * receipts in test mode. The sender and the support email (US-11 AC6) are the Org-Wide Email Address named
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

    @TestVisible
    private static Messaging.SingleEmailMessage buildReceipt(Opportunity donation, OrgWideEmailAddress sender) {
        List<String> lines = new List<String>{
            'Gracias por tu donación al programa Mexico Dreamin.',
            '',
            'Referencia: ' + donation.Donation_Reference__c,
            'Campaña: ' + donation.Campaign.Name,
            'Monto: $' + (donation.Amount ?? 0).setScale(2).format() + ' MXN',
            'Fecha: ' + donation.CloseDate.format(),
            'Tipo de donación: ' + donation.Donation_Type__c
        };
        // An anonymous receipt never shows a name, even when names are stored for the invoice (US-02 AC2).
        if (!donation.Is_Anonymous__c) {
            lines.add('Donante: ' + donorName(donation));
        }
        lines.add('');
        lines.add('Este recibo no es un comprobante fiscal (CFDI).');
        if (donation.Invoice_Requested__c) {
            lines.add('Adjuntamos tu factura simulada en PDF; tampoco es un comprobante fiscal.');
        }
        if (sender != null) {
            lines.add('Si tienes un problema con tu recibo o tu factura, escríbenos a ' + sender.Address + '.');
        }

        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        email.setToAddresses(new List<String>{ donation.Donor_Email__c });
        email.setSubject('Recibo de tu donación ' + donation.Donation_Reference__c);
        email.setPlainTextBody(String.join(lines, '\n'));
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
        pdf.setFileName('Factura-simulada-' + donation.Donation_Reference__c + '.pdf');
        pdf.setContentType('application/pdf');
        pdf.setBody(Blob.toPdf(invoiceHtml(donation)));
        return pdf;
    }

    // US-06 AC3 and AC8: a simulated invoice, clearly not a tax document; no CFDI and no SAT or third-party service.
    // ponytail: name, RFC and person type only; a real CFDI 4.0 also needs tax regime, ZIP code and CFDI use.
    @TestVisible
    private static String invoiceHtml(Opportunity donation) {
        List<String> rows = new List<String>{
            row('Folio', donation.Donation_Reference__c),
            row('Fecha', donation.CloseDate.format()),
            row('Emisor', 'Programa de donaciones Mexico Dreamin (ficticio)'),
            row('Receptor', donorName(donation)),
            row('RFC', donation.RFC__c),
            row('Tipo de persona', donation.Person_Type__c),
            row('Concepto', 'Donación · ' + donation.Campaign.Name),
            row('Total', '$' + (donation.Amount ?? 0).setScale(2).format() + ' MXN')
        };
        return '<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/></head>'
            + '<body style="font-family: Arial Unicode MS, sans-serif;">'
            + '<h1>Factura simulada</h1>'
            + '<p><b>No es un comprobante fiscal (CFDI).</b> Documento generado para una demostración: '
            + 'no fue timbrado ante el SAT y no sirve para deducir impuestos.</p>'
            + '<table>' + String.join(rows, '') + '</table></body></html>';
    }

    // Donor text is escaped, so it shows as plain text in the PDF (US-12).
    private static String row(String label, String value) {
        return '<tr><td><b>' + label + '</b></td><td>' + (value ?? '').escapeHtml4() + '</td></tr>';
    }

    private static String donorName(Opportunity donation) {
        if (String.isNotBlank(donation.Donor_Company__c)) {
            return donation.Donor_Company__c;
        }
        return ((donation.Donor_First_Name__c ?? '') + ' ' + (donation.Donor_Last_Name__c ?? '')).trim();
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
