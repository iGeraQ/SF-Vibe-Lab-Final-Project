@IsTest
private class DonationReceiptServiceTest {

    @TestSetup
    static void setup() {
        // Marking a donation paid needs the payment permission (Payment_Fields_Locked), as the payment integration has.
        User integration = new User(
            ProfileId = UserInfo.getProfileId(),
            Username = 'recibos.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Recibos',
            Email = 'recibos@example.com',
            Alias = 'recibos',
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
            insert as system new List<Opportunity>{
                newDonation(campaign.Id, 'DON-CREDITO1', false),
                newDonation(campaign.Id, 'DON-ANONIMA1', true)
            };
        }
    }

    @IsTest
    static void paidDonationGetsOneReceipt() {
        System.runAs(integrationUser()) {
            markPaid('DON-CREDITO1');

            Assert.areEqual(1, Limits.getEmailInvocations(), 'The receipt is sent when the donation becomes paid');
        }
        Assert.isTrue(donation('DON-CREDITO1').Receipt_Sent__c);
    }

    @IsTest
    static void receiptIsNotSentTwice() {
        System.runAs(integrationUser()) {
            markPaid('DON-CREDITO1');
            Opportunity paid = donation('DON-CREDITO1');
            paid.Public_Name__c = 'Familia Prueba Editada';
            update as system paid;

            Assert.areEqual(1, Limits.getEmailInvocations(), 'A later edit of a paid donation sends nothing');
        }
    }

    @IsTest
    static void unpaidDonationGetsNoReceipt() {
        System.runAs(integrationUser()) {
            Opportunity expired = donation('DON-CREDITO1');
            expired.StageName = 'Expired';
            update as system expired;

            Assert.areEqual(0, Limits.getEmailInvocations(), 'An expired donation gets no receipt (US-14 AC6)');
        }
        Assert.isFalse(donation('DON-CREDITO1').Receipt_Sent__c);
    }

    @IsTest
    static void receiptShowsDonationDetailsInSpanish() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-CREDITO1').Id })[0];

        Messaging.SingleEmailMessage email = DonationReceiptService.buildReceipt(record, null);
        String body = email.getPlainTextBody();

        Assert.areEqual('donante@example.com', email.getToAddresses()[0]);
        Assert.isTrue(email.getSubject().contains('DON-CREDITO1'), email.getSubject());
        Assert.isTrue(body.contains('Referencia: DON-CREDITO1'), body);
        Assert.isTrue(body.contains('Campaña: Becas 2026'), body);
        Assert.isTrue(body.contains('250'), body);
        Assert.isTrue(body.contains('Tipo de donación: Acreditada'), body);
        Assert.isTrue(body.contains('Donante: Zacarias Prueba'), body);
    }

    @IsTest
    static void anonymousReceiptShowsNoName() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-ANONIMA1').Id })[0];

        String body = DonationReceiptService.buildReceipt(record, null).getPlainTextBody();

        Assert.isFalse(body.contains('Zacarias'), 'An anonymous receipt never shows a name, even with an invoice (US-02 AC2)');
        Assert.isTrue(body.contains('Tipo de donación: Anónima con factura'), body);
    }

    @IsTest
    static void receiptShowsSupportEmailWhenConfigured() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-CREDITO1').Id })[0];

        String body = DonationReceiptService.buildReceipt(record, new OrgWideEmailAddress(Address = 'soporte@example.com'))
            .getPlainTextBody();

        Assert.isTrue(body.contains('soporte@example.com'), 'US-11 AC6: the receipt shows the support email');
    }

    @IsTest
    static void invoiceDonationGetsTheSimulatedInvoiceAttached() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-ANONIMA1').Id })[0];

        Messaging.SingleEmailMessage email = DonationReceiptService.buildReceipt(record, null);

        Assert.areEqual(1, email.getFileAttachments().size(), 'US-06 AC8: the invoice arrives with the receipt');
        Messaging.EmailFileAttachment pdf = email.getFileAttachments()[0];
        Assert.areEqual('Factura-simulada-DON-ANONIMA1.pdf', pdf.getFileName());
        Assert.areEqual('application/pdf', pdf.getContentType());
        Assert.isTrue(pdf.getBody().size() > 0, 'The PDF has content');
        Assert.isTrue(email.getPlainTextBody().contains('factura simulada'), email.getPlainTextBody());
    }

    @IsTest
    static void donationWithoutInvoiceGetsNoAttachment() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-CREDITO1').Id })[0];

        Messaging.SingleEmailMessage email = DonationReceiptService.buildReceipt(record, null);

        Assert.isTrue(email.getFileAttachments() == null || email.getFileAttachments().isEmpty());
    }

    @IsTest
    static void invoiceShowsTaxDataAndSaysItIsNotATaxDocument() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-ANONIMA1').Id })[0];

        // escapeHtml4 also turns accents into entities, which the PDF shows correctly.
        String invoice = DonationReceiptService.invoiceHtml(record).unescapeHtml4();

        for (String expected : new List<String>{
            'DON-ANONIMA1', 'Zacarias Prueba', 'XAXX010101000', 'Persona física', 'Donación · Becas 2026', '250',
            'No es un comprobante fiscal (CFDI)'
        }) {
            Assert.isTrue(invoice.contains(expected), 'Missing ' + expected + ' (US-06 AC3, AC8)');
        }
    }

    @IsTest
    static void invoiceEscapesTheDonorText() {
        Opportunity record = DonationReceiptService.loadDonations(new Set<Id>{ donation('DON-ANONIMA1').Id })[0];
        record.Donor_First_Name__c = '<script>alert(1)</script>';

        String invoice = DonationReceiptService.invoiceHtml(record);

        Assert.isFalse(invoice.contains('<script>'), 'Donor text is shown as plain text (US-12)');
    }

    @IsTest
    static void paidInvoiceDonationSendsOneEmail() {
        System.runAs(integrationUser()) {
            markPaid('DON-ANONIMA1');

            Assert.areEqual(1, Limits.getEmailInvocations(), 'Receipt and invoice go in one email');
        }
        Assert.isTrue(donation('DON-ANONIMA1').Receipt_Sent__c);
    }

    private static void markPaid(String reference) {
        Opportunity record = donation(reference);
        record.StageName = 'Paid';
        update as system record;
    }

    private static Opportunity donation(String reference) {
        return [
            SELECT Id, StageName, Receipt_Sent__c, Public_Name__c
            FROM Opportunity
            WHERE Donation_Reference__c = :reference
            WITH SYSTEM_MODE
        ];
    }

    private static User integrationUser() {
        return [SELECT Id FROM User WHERE Username = :('recibos.' + UserInfo.getOrganizationId() + '@example.com')];
    }

    // The anonymous one also requests an invoice, so it stores names the receipt must not show.
    private static Opportunity newDonation(Id campaignId, String reference, Boolean anonymous) {
        return new Opportunity(
            Name = reference + ' · Becas 2026',
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            CampaignId = campaignId,
            StageName = 'Pending',
            Amount = 250,
            CloseDate = Date.today(),
            Donation_Reference__c = reference,
            Donor_Email__c = 'donante@example.com',
            Is_Anonymous__c = anonymous,
            Public_Name__c = anonymous ? null : 'Familia Prueba',
            Donor_First_Name__c = 'Zacarias',
            Donor_Last_Name__c = 'Prueba',
            Invoice_Requested__c = anonymous,
            Person_Type__c = anonymous ? 'Individual' : null,
            RFC__c = anonymous ? 'XAXX010101000' : null,
            Invoice_Consent__c = anonymous,
            Invoice_Consent_Date__c = anonymous ? Datetime.now() : null
        );
    }
}
