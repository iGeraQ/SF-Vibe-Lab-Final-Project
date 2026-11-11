@IsTest
private class DonationEmailTemplateTest {

    @IsTest
    static void receiptIsAStyledHtmlEmail() {
        // Accents inside the HTML may be entities (escapeHtml4); the email client shows them correctly.
        String html = DonationEmailTemplate.receiptHtml(donation(false, false), null).unescapeHtml4();

        for (String expected : new List<String>{
            '<!DOCTYPE html>', 'lang="es"', '¡Gracias por tu donación!', 'Mexico Dreamin 2026', 'DON-TEST0001', 'Becas 2026',
            '250', '10 de noviembre de 2026', 'Acreditada', 'Zacarias Prueba', 'no es un comprobante fiscal (CFDI)'
        }) {
            Assert.isTrue(html.contains(expected), 'Missing ' + expected + ' in ' + html);
        }
        Assert.isTrue(html.contains('background-color'), 'The styles are inline, which is what email clients support');
    }

    @IsTest
    static void receiptSaysItIsADemoAndAdaptsToPhones() {
        String html = DonationEmailTemplate.receiptHtml(donation(false, false), null).unescapeHtml4();

        Assert.isTrue(html.contains('modo de prueba'), 'The ribbon says no real charge was made');
        Assert.isTrue(html.contains('@media'), 'Phones get a full-width card and stacked columns');
        Assert.isTrue(html.contains('Recibo #DON-TEST0001'), 'The receipt number is under the title');
        Assert.isTrue(html.contains('Monto pagado') && html.contains('Resumen'), 'Key data and summary box');
    }

    @IsTest
    static void receiptGreetsTheDonorByFirstName() {
        String html = DonationEmailTemplate.receiptHtml(donation(false, false), null);

        Assert.isTrue(html.contains('¡Hola, Zacarias!'), html);
    }

    @IsTest
    static void anonymousReceiptShowsNoName() {
        // The anonymous donation also requested an invoice, so it stores names the receipt must not show (US-02 AC2).
        Opportunity anonymous = donation(true, true);

        String html = DonationEmailTemplate.receiptHtml(anonymous, null);
        String text = DonationEmailTemplate.receiptText(anonymous, null);

        Assert.isFalse(html.contains('Zacarias'), 'No name in the HTML');
        Assert.isFalse(text.contains('Zacarias'), 'No name in the plain text');
        Assert.isTrue(html.contains('¡Hola!'), html);
        Assert.isTrue(html.unescapeHtml4().contains('Anónima con factura'), html);
    }

    @IsTest
    static void donorTextIsEscapedInTheEmail() {
        Opportunity donation = donation(false, false);
        donation.Donor_First_Name__c = '<script>alert(1)</script>';

        String html = DonationEmailTemplate.receiptHtml(donation, null);

        Assert.isFalse(html.contains('<script'), 'Donor text is shown as plain text (US-12)');
        Assert.isTrue(html.contains('&lt;script&gt;'), html);
    }

    @IsTest
    static void supportEmailIsALinkWhenConfigured() {
        Assert.isTrue(DonationEmailTemplate.receiptHtml(donation(false, false), 'soporte@example.com').contains('mailto:soporte@example.com'),
            'US-11 AC6');
        Assert.isFalse(DonationEmailTemplate.receiptHtml(donation(false, false), null).contains('mailto:'));
    }

    @IsTest
    static void invoiceAttachmentIsMentionedOnlyWhenRequested() {
        Assert.isTrue(DonationEmailTemplate.receiptHtml(donation(false, true), null).contains('Factura-simulada-DON-TEST0001.pdf'));
        Assert.isFalse(DonationEmailTemplate.receiptHtml(donation(false, false), null).contains('Factura-simulada'));
        Assert.areEqual('Factura-simulada-DON-TEST0001.pdf', DonationEmailTemplate.invoiceFileName(donation(false, true)));
    }

    @IsTest
    static void receiptTextHasTheSameDetails() {
        String text = DonationEmailTemplate.receiptText(donation(false, false), 'soporte@example.com');

        for (String expected : new List<String>{
            '¡Hola, Zacarias!', 'Referencia: DON-TEST0001', 'Campaña: Becas 2026', '250', 'Fecha: 10 de noviembre de 2026',
            'Tipo de donación: Acreditada', 'Donante: Zacarias Prueba', 'soporte@example.com'
        }) {
            Assert.isTrue(text.contains(expected), 'Missing ' + expected + ' in ' + text);
        }
    }

    @IsTest
    static void amountsShowCentsAndThousandsSeparators() {
        Opportunity small = donation(false, false);
        Opportunity large = donation(false, false);
        large.Amount = 1234567.5;

        Assert.isTrue(DonationEmailTemplate.receiptText(small, null).contains('Monto: $250.00 MXN'));
        Assert.isTrue(DonationEmailTemplate.receiptText(large, null).contains('Monto: $1,234,567.50 MXN'));
        Assert.isTrue(DonationEmailTemplate.receiptHtml(small, null).contains('$250.00'));
        Assert.isTrue(DonationEmailTemplate.invoiceHtml(donation(false, true)).contains('$250.00 MXN'));
    }

    @IsTest
    static void subjectCarriesTheReference() {
        Assert.isTrue(DonationEmailTemplate.subject(donation(false, false)).contains('DON-TEST0001'));
    }

    @IsTest
    static void datesAreWrittenInSpanish() {
        Opportunity december = donation(false, false);
        december.CloseDate = Date.newInstance(2026, 12, 5);

        Assert.isTrue(DonationEmailTemplate.receiptText(december, null).contains('5 de diciembre de 2026'));
    }

    @IsTest
    static void invoiceShowsTaxDataAndSaysItIsNotATaxDocument() {
        String invoice = DonationEmailTemplate.invoiceHtml(donation(false, true)).unescapeHtml4();

        for (String expected : new List<String>{
            'DON-TEST0001', 'Zacarias Prueba', 'XAXX010101000', 'Persona física', 'Donación · Becas 2026', '250',
            'No es un comprobante fiscal (CFDI)', 'modo de prueba', 'Folio #DON-TEST0001'
        }) {
            Assert.isTrue(invoice.contains(expected), 'Missing ' + expected + ' (US-06 AC3, AC8)');
        }
        Assert.isTrue(invoice.contains('<style'), 'The invoice has a style sheet');
    }

    @IsTest
    static void invoiceEscapesTheDonorText() {
        Opportunity donation = donation(false, true);
        donation.Donor_First_Name__c = '<script>alert(1)</script>';

        Assert.isFalse(DonationEmailTemplate.invoiceHtml(donation).contains('<script'), 'Donor text is shown as plain text (US-12)');
    }

    @IsTest
    static void invoiceBecomesAPdf() {
        Blob pdf = Blob.toPdf(DonationEmailTemplate.invoiceHtml(donation(false, true)));

        Assert.isTrue(pdf.size() > 0, 'The styled invoice renders as a PDF');
    }

    // In memory, no DML: the JSON route also fills the formula field Donation_Type__c.
    private static Opportunity donation(Boolean anonymous, Boolean invoice) {
        String type = anonymous ? (invoice ? 'Anónima con factura' : 'Anónima') : (invoice ? 'Factura' : 'Acreditada');
        Map<String, Object> fields = new Map<String, Object>{
            'attributes' => new Map<String, Object>{ 'type' => 'Opportunity' },
            'Donation_Reference__c' => 'DON-TEST0001',
            'Donor_Email__c' => 'donante@example.com',
            'Amount' => 250,
            'CloseDate' => '2026-11-10',
            'Donation_Type__c' => type,
            'Is_Anonymous__c' => anonymous,
            'Invoice_Requested__c' => invoice,
            'Donor_First_Name__c' => 'Zacarias',
            'Donor_Last_Name__c' => 'Prueba',
            'RFC__c' => invoice ? 'XAXX010101000' : null,
            'Person_Type__c' => invoice ? 'Persona física' : null,
            'Campaign' => new Map<String, Object>{
                'attributes' => new Map<String, Object>{ 'type' => 'Campaign' },
                'Name' => 'Becas 2026'
            }
        };
        return (Opportunity) JSON.deserialize(JSON.serialize(fields), Opportunity.class);
    }
}
