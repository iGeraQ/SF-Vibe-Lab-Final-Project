// The validation rules and the type formula of a donation, as the donor meets them (US-02, US-03, US-06).
// Donations are saved without a campaign: no rule needs one. In system mode so the test doesn't depend on the
// running user's field access.
@IsTest
private class DonationRulesTest {

    @IsTest
    static void donorEmailIsRequired() {
        Opportunity donation = credited();
        donation.Donor_Email__c = null;

        Assert.isTrue(rejection(donation).contains('correo'), 'US-02: every donation needs an email for the receipt');
    }

    @IsTest
    static void creditedDonationNeedsAPublicNameAndADonorName() {
        Opportunity noPublicName = credited();
        noPublicName.Public_Name__c = null;
        Opportunity noDonorName = credited();
        noDonorName.Donor_First_Name__c = null;
        noDonorName.Donor_Last_Name__c = null;

        Assert.isTrue(rejection(noPublicName).contains('nombre que quieres que aparezca'), 'US-05');
        Assert.isTrue(rejection(noDonorName).contains('nombre y apellidos'), 'US-03 refinement 3');
        noDonorName.Donor_Company__c = 'Empresa Prueba SA';
        Assert.isNull(rejection(noDonorName), 'A company name is enough');
    }

    @IsTest
    static void anonymousDonationNeedsOnlyTheEmail() {
        Opportunity donation = credited();
        donation.Is_Anonymous__c = true;
        donation.Public_Name__c = null;
        donation.Donor_First_Name__c = null;
        donation.Donor_Last_Name__c = null;

        Assert.isNull(rejection(donation), 'US-02 AC5, US-03 refinement 3');
    }

    @IsTest
    static void invoiceNeedsRfcPersonTypeAndConsent() {
        Opportunity noRfc = invoice('Individual', null);
        Opportunity noType = invoice(null, 'PEGJ800101AB3');
        Opportunity noConsent = invoice('Individual', 'PEGJ800101AB3');
        noConsent.Invoice_Consent__c = false;

        Assert.isTrue(rejection(noRfc).contains('RFC'), 'US-06 AC1');
        Assert.isTrue(rejection(noType).contains('persona física o moral'), 'US-06 AC4');
        Assert.isTrue(rejection(noConsent).contains('aceptar'), 'US-06 AC6');
    }

    @IsTest
    static void rfcMustFollowTheSatPatternForItsPersonType() {
        Assert.isNull(rejection(invoice('Individual', 'PEGJ800101AB3')), 'Individual, 13 characters');
        Assert.isNull(rejection(invoice('Company', 'ABC010101AB1')), 'Company, 12 characters');
        Assert.isNull(rejection(invoice('Company', 'A&B010101AB1')), 'Company with an ampersand');
        for (String invalid : new List<String>{
            'PEGJ800101AB', 'PEGJ801301AB3', 'PEGJ800132AB3', 'PEGJ800101ABZ', 'PEG$800101AB3', 'pegj800101ab3'
        }) {
            Assert.isTrue(rejection(invoice('Individual', invalid)).contains('RFC'), 'US-06 AC2 should reject ' + invalid);
        }
        Assert.isTrue(rejection(invoice('Company', 'PEGJ800101AB3')).contains('RFC'), 'US-06 AC5: a company with 13 characters');
    }

    @IsTest
    static void anonymousDonationCanRequestAnInvoice() {
        Opportunity donation = invoice('Individual', 'PEGJ800101AB3');
        donation.Is_Anonymous__c = true;
        donation.Public_Name__c = null;

        Assert.isNull(rejection(donation), 'US-02 AC3, approved by the client on Nov 9');
    }

    @IsTest
    static void donationTypeFollowsTheTwoCheckboxes() {
        Opportunity creditedDonation = credited();
        Opportunity invoiceDonation = invoice('Individual', 'PEGJ800101AB3');
        Opportunity anonymousDonation = credited();
        anonymousDonation.Is_Anonymous__c = true;
        anonymousDonation.Public_Name__c = null;
        Opportunity anonymousInvoice = invoice('Individual', 'PEGJ800101AB3');
        anonymousInvoice.Is_Anonymous__c = true;
        anonymousInvoice.Public_Name__c = null;
        Database.insert(new List<Opportunity>{ creditedDonation, invoiceDonation, anonymousDonation, anonymousInvoice },
            true, AccessLevel.SYSTEM_MODE);
        List<Id> ids = new List<Id>{ creditedDonation.Id, invoiceDonation.Id, anonymousDonation.Id, anonymousInvoice.Id };

        Map<Id, Opportunity> saved = new Map<Id, Opportunity>([
            SELECT Donation_Type__c FROM Opportunity WHERE Id IN :ids WITH SYSTEM_MODE
        ]);
        Assert.areEqual('Acreditada', saved.get(creditedDonation.Id).Donation_Type__c);
        Assert.areEqual('Factura', saved.get(invoiceDonation.Id).Donation_Type__c);
        Assert.areEqual('Anónima', saved.get(anonymousDonation.Id).Donation_Type__c);
        Assert.areEqual('Anónima con factura', saved.get(anonymousInvoice.Id).Donation_Type__c, 'US-09 AC1');
    }

    // The first error the donor would see, or null when the donation is accepted.
    private static String rejection(Opportunity donation) {
        Database.SaveResult result = Database.insert(donation, false, AccessLevel.SYSTEM_MODE);
        return result.isSuccess() ? null : result.getErrors()[0].getMessage();
    }

    private static Opportunity credited() {
        return new Opportunity(
            Name = 'Donación de prueba',
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            StageName = 'Pending',
            Amount = 250,
            CloseDate = Date.today(),
            Is_Anonymous__c = false,
            Public_Name__c = 'Familia Prueba',
            Donor_Email__c = 'donante@example.com',
            Donor_First_Name__c = 'Ana',
            Donor_Last_Name__c = 'Prueba'
        );
    }

    private static Opportunity invoice(String personType, String rfc) {
        Opportunity donation = credited();
        donation.Invoice_Requested__c = true;
        donation.Invoice_Consent__c = true;
        donation.Invoice_Consent_Date__c = Datetime.now();
        donation.Person_Type__c = personType;
        donation.RFC__c = rfc;
        if (personType == 'Company') {
            donation.Donor_Company__c = 'Empresa Prueba SA';
        }
        return donation;
    }
}
