/**
 * Checks each staff role does what US-05, US-08 and US-09 describe and nothing more. Each role user has the
 * "Minimum Access - Salesforce" profile plus its permission set group, as in the README, and the DML runs in
 * user mode, so object and field access are really enforced.
 */
@IsTest
private class StaffRolesTest {

    @TestSetup
    static void setup() {
        Id minimumAccess = [SELECT Id FROM Profile WHERE Name = 'Minimum Access - Salesforce'].Id;
        Map<String, Id> groups = new Map<String, Id>();
        for (PermissionSetGroup roleGroup : [SELECT Id, DeveloperName FROM PermissionSetGroup WHERE DeveloperName LIKE 'Donations_%']) {
            groups.put(roleGroup.DeveloperName, roleGroup.Id);
        }
        for (Id groupId : groups.values()) {
            Test.calculatePermissionSetGroup(groupId);
        }
        User manager = staffUser('cmgr', minimumAccess);
        manager.UserPermissionsMarketingUser = true;
        User moderator = staffUser('mod', minimumAccess);
        // runAs lifts the license limit for test users and keeps the setup DML apart from the data DML.
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert new List<User>{ manager, moderator };
            insert new List<PermissionSetAssignment>{
                new PermissionSetAssignment(AssigneeId = manager.Id, PermissionSetGroupId = groups.get('Donations_Campaign_Manager_Group')),
                new PermissionSetAssignment(AssigneeId = moderator.Id, PermissionSetGroupId = groups.get('Donations_Moderator_Group'))
            };
        }
        System.runAs(manager) {
            Campaign open = campaign('Abierta');
            insert as system open;
            insert as system new Opportunity(
                Name = 'Donación de prueba',
                RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
                CampaignId = open.Id,
                StageName = 'Pending',
                Amount = 250,
                CloseDate = Date.today(),
                Donor_Email__c = 'donante@example.com',
                Donor_First_Name__c = 'Zacarias',
                Donor_Last_Name__c = 'Prueba',
                Public_Name__c = 'Familia Prueba'
            );
        }
    }

    @IsTest
    static void campaignManagerCreatesACompleteCampaign() {
        Campaign created = campaign('Nueva');
        System.runAs(roleUser('cmgr')) {
            insert as user created;
        }

        Assert.isNotNull(created.Id, 'US-08 AC1: dates, goal, description, image and purpose are editable');
    }

    @IsTest
    static void campaignManagerCannotSaveAnIncompleteCampaign() {
        Campaign incomplete = campaign('Incompleta');
        incomplete.EndDate = null;
        String message;
        System.runAs(roleUser('cmgr')) {
            try {
                insert as user incomplete;
            } catch (DmlException e) {
                message = e.getDmlMessage(0);
            }
        }

        Assert.areEqual('Para guardar la campaña captura fecha de inicio, fecha de fin, meta, descripción, URL de imagen y propósito.', message, 'US-08 AC3');
    }

    @IsTest
    static void moderatorCannotCreateCampaigns() {
        Boolean blocked = false;
        System.runAs(roleUser('mod')) {
            try {
                insert as user campaign('No permitida');
            } catch (Exception e) {
                blocked = true;
            }
        }

        Assert.isTrue(blocked, 'US-08 AC6');
    }

    @IsTest
    static void everyRoleSeesDonationStatusAmountCampaignAndEmail() {
        for (String alias : new List<String>{ 'cmgr', 'mod' }) {
            Opportunity donation;
            System.runAs(roleUser(alias)) {
                donation = [SELECT StageName, Amount, CampaignId, Donation_Type__c, Donor_Email__c FROM Opportunity WITH USER_MODE LIMIT 1];
            }
            Assert.areEqual(250, donation.Amount, 'US-09 AC1 for ' + alias);
            Assert.isNotNull(donation.CampaignId, 'US-09 AC1 for ' + alias);
            Assert.areEqual('Acreditada', donation.Donation_Type__c, 'US-09 AC1 for ' + alias);
            Assert.areEqual('donante@example.com', donation.Donor_Email__c, 'US-09 AC2 for ' + alias);
        }
    }

    @IsTest
    static void moderatorChangesTheDisplayName() {
        Opportunity donation = new Opportunity(Id = donationId(), Public_Name__c = 'Nombre moderado');
        System.runAs(roleUser('mod')) {
            update as user donation;
        }

        Assert.areEqual('Nombre moderado', [SELECT Public_Name__c FROM Opportunity WHERE Id = :donation.Id WITH SYSTEM_MODE].Public_Name__c, 'US-05 AC7');
    }

    @IsTest
    static void moderatorCannotChangeTheAmount() {
        Boolean blocked = false;
        System.runAs(roleUser('mod')) {
            try {
                update as user new Opportunity(Id = donationId(), Amount = 1);
            } catch (Exception e) {
                blocked = true;
            }
        }

        Assert.isTrue(blocked, 'US-09 AC3');
        Assert.areEqual(250, [SELECT Amount FROM Opportunity WHERE Id = :donationId() WITH SYSTEM_MODE].Amount);
    }

    @IsTest
    static void campaignManagerCannotChangeTheDisplayName() {
        Boolean blocked = false;
        System.runAs(roleUser('cmgr')) {
            try {
                update as user new Opportunity(Id = donationId(), Public_Name__c = 'Otro nombre');
            } catch (Exception e) {
                blocked = true;
            }
        }

        Assert.isTrue(blocked, 'US-09 AC4');
    }

    private static User roleUser(String alias) {
        return [SELECT Id FROM User WHERE Username = :(alias + '.staff.' + UserInfo.getOrganizationId() + '@example.com')];
    }

    private static Id donationId() {
        return [SELECT Id FROM Opportunity WITH SYSTEM_MODE LIMIT 1].Id;
    }

    private static User staffUser(String alias, Id profileId) {
        return new User(
            ProfileId = profileId,
            Username = alias + '.staff.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Staff ' + alias,
            Email = alias + '@example.com',
            Alias = alias,
            TimeZoneSidKey = 'America/Merida',
            LocaleSidKey = 'es_MX',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'es'
        );
    }

    private static Campaign campaign(String name) {
        return new Campaign(
            Name = name,
            StartDate = Date.today().addDays(-1),
            EndDate = Date.today().addDays(30),
            IsActive = true,
            ExpectedRevenue = 1000,
            Description = 'Campaña de prueba',
            Image_URL__c = 'https://example.com/campana.png',
            Purpose__c = 'Boletos para estudiantes'
        );
    }
}
