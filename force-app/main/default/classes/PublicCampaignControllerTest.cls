@IsTest
private class PublicCampaignControllerTest {

    @TestSetup
    static void setup() {
        // Paid donations need the payment permission (Payment_Fields_Locked).
        Id permSetId = [SELECT Id FROM PermissionSet WHERE Name = 'Donations_Payment_Integration'].Id;
        if ([SELECT COUNT() FROM PermissionSetAssignment WHERE AssigneeId = :UserInfo.getUserId() AND PermissionSetId = :permSetId] == 0) {
            insert new PermissionSetAssignment(AssigneeId = UserInfo.getUserId(), PermissionSetId = permSetId);
        }
        // runAs applies the new permission and keeps the setup DML apart from the data DML.
        System.runAs(new User(Id = UserInfo.getUserId())) {
            Campaign active = campaign('Activa', -1, 30);
            Campaign paused = campaign('Pausada', -1, 30);
            paused.IsActive = false;
            insert new List<Campaign>{ active, paused, campaign('Pasada', -30, -1), campaign('Futura', 5, 30) };

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
            insert donations;
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
        Assert.areEqual(50, active.progress);
        Assert.areEqual('Boletos para estudiantes', active.purpose);
        Assert.areEqual('https://example.com/campana.png', active.imageUrl);
    }

    @IsTest
    static void pastCampaignsListOnlyEndedOnes() {
        List<PublicCampaignController.CampaignView> campaigns = PublicCampaignController.getPastCampaigns();

        Assert.areEqual(1, campaigns.size());
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
    static void recognitionOfCampaignWithoutDonationsIsEmpty() {
        PublicCampaignController.Recognition recognition = PublicCampaignController.getRecognition(campaignId('Futura'));

        Assert.areEqual(0, recognition.donors.size());
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
