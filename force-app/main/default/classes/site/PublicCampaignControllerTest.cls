@IsTest
private class PublicCampaignControllerTest {

    @TestSetup
    static void setup() {
        // Paid donations need the payment permission (Payment_Fields_Locked), so the data is created by a
        // test user that holds it, as the payment integration would.
        User integration = new User(
            ProfileId = UserInfo.getProfileId(),
            Username = 'integracion.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Integración',
            Email = 'integracion@example.com',
            Alias = 'integra',
            TimeZoneSidKey = 'America/Merida',
            LocaleSidKey = 'es_MX',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'es',
            UserPermissionsMarketingUser = true // creating campaigns needs Marketing User, even from Apex
        );
        // runAs lifts the license limit for the test user and keeps the setup DML apart from the data DML.
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert integration;
            insert new PermissionSetAssignment(
                AssigneeId = integration.Id,
                PermissionSetId = [SELECT Id FROM PermissionSet WHERE Name = 'Donations_Payment_Integration'].Id
            );
        }

        System.runAs(integration) {
            Campaign active = campaign('Activa', -1, 30);
            Campaign paused = campaign('Pausada', -1, 30);
            paused.IsActive = false;
            Campaign endedInactive = campaign('Pasada inactiva', -30, -1);
            endedInactive.IsActive = false;
            // as system: the new fields have no field access on any profile until a permission set grants it.
            insert as system new List<Campaign>{ active, paused, endedInactive, campaign('Pasada', -30, -1), campaign('Futura', 5, 30) };

            Opportunity older = donation('Paid', 100, 'Empresa Uno');
            older.CloseDate = Date.today().addDays(-1);
            List<Opportunity> donations = new List<Opportunity>{
                donation('Paid', 250, 'Familia Pérez'),
                older,
                donation('Paid', 100, null),
                donation('Paid', 50, null),
                donation('Pending', 999, 'Todavía Pendiente')
            };
            for (Opportunity record : donations) {
                record.CampaignId = active.Id;
            }
            Opportunity hidden = donation('Paid', 300, 'Donante Oculto');
            hidden.CampaignId = paused.Id;
            donations.add(hidden);
            insert as system donations;
        }
    }

    @IsTest
    static void activeCampaignsExcludePastFutureAndPaused() {
        List<PublicCampaignController.CampaignView> campaigns = PublicCampaignController.getActiveCampaigns();

        Assert.areEqual(1, campaigns.size(), 'Only the open campaign accepts donations');
        Assert.areEqual('Activa', campaigns[0].name);
    }

    @IsTest
    static void activeCampaignShowsGoalAndPaidProgressOnly() {
        PublicCampaignController.CampaignView active = PublicCampaignController.getActiveCampaigns()[0];

        Assert.areEqual(1000, active.goal);
        Assert.areEqual(500, active.raised, 'Paid donations only: the pending 999 does not count');
        Assert.areEqual(50, active.progress, 'Progress is a percentage');
        Assert.areEqual('Boletos para estudiantes', active.purpose);
        Assert.areEqual('https://example.com/campana.png', active.imageUrl);
    }

    @IsTest
    static void pastCampaignsListOnlyCampaignsThatEndedWhileActive() {
        List<PublicCampaignController.CampaignView> campaigns = PublicCampaignController.getPastCampaigns();

        Assert.areEqual(1, campaigns.size(), 'An ended campaign that was inactive is not public');
        Assert.areEqual('Pasada', campaigns[0].name);
    }

    @IsTest
    static void recognitionListsPaidCreditedDonorsNewestFirst() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(campaignId('Activa'));

        Assert.areEqual(2, recognition.donors.size(), 'Anonymous and pending donations are not listed');
        Assert.areEqual('Familia Pérez', recognition.donors[0].name);
        Assert.areEqual(250, recognition.donors[0].amount);
        Assert.areEqual('Empresa Uno', recognition.donors[1].name);
    }

    @IsTest
    static void recognitionSumsAnonymousDonationsApart() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(campaignId('Activa'));

        Assert.areEqual(150, recognition.anonymousTotal);
    }

    @IsTest
    static void recognitionExposesNoPrivateData() {
        String json = JSON.serialize(PublicCampaignController.getRecognition(campaignId('Activa')));

        Assert.isFalse(json.contains('@example.com'), 'No donor email');
        Assert.isFalse(json.contains('Zacarias'), 'No real first name');
        Assert.isFalse(json.contains('XAXX010101000'), 'No RFC');
    }

    @IsTest
    static void recognitionOfPublicCampaignWithoutDonationsIsEmpty() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(campaignId('Pasada'));

        Assert.areEqual(0, recognition.donors.size());
        Assert.areEqual(0, recognition.anonymousTotal);
    }

    @IsTest
    static void recognitionOfHiddenCampaignIsEmpty() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(campaignId('Pausada'));

        Assert.areEqual(0, recognition.donors.size(), 'A paused campaign is not public, even with paid donations');
    }

    @IsTest
    static void recognitionWithoutCampaignIsEmpty() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(null);

        Assert.areEqual(0, recognition.donors.size(), 'A null id must not match donations without a campaign');
        Assert.areEqual(0, recognition.anonymousTotal);
    }

    private static Id campaignId(String name) {
        return [SELECT Id FROM Campaign WHERE Name = :name].Id;
    }

    private static Campaign campaign(String name, Integer startOffset, Integer endOffset) {
        return new Campaign(
            Name = name,
            StartDate = Date.today().addDays(startOffset),
            EndDate = Date.today().addDays(endOffset),
            IsActive = true,
            ExpectedRevenue = 1000,
            Description = 'Campaña de prueba',
            Image_URL__c = 'https://example.com/campana.png',
            Purpose__c = 'Boletos para estudiantes'
        );
    }

    // publicName null means an anonymous donation. Every donation carries private data the site must never return.
    private static Opportunity donation(String stage, Decimal amount, String publicName) {
        Boolean anonymous = publicName == null;
        return new Opportunity(
            Name = 'Donación de prueba',
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            StageName = stage,
            Amount = amount,
            CloseDate = Date.today(),
            Is_Anonymous__c = anonymous,
            Public_Name__c = publicName,
            Donor_Email__c = 'donante@example.com',
            Donor_First_Name__c = anonymous ? null : 'Zacarias',
            Donor_Last_Name__c = anonymous ? null : 'Prueba',
            Invoice_Requested__c = !anonymous,
            Person_Type__c = anonymous ? null : 'Individual',
            RFC__c = anonymous ? null : 'XAXX010101000',
            Invoice_Consent__c = !anonymous,
            Invoice_Consent_Date__c = anonymous ? null : Datetime.now()
        );
    }
}
