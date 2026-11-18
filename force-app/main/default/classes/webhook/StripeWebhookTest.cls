@IsTest
private class StripeWebhookTest {

    private static final String SECRET = 'whsec_test_secret';

    @TestSetup
    static void setup() {
        insert new Stripe_Webhook_Config__c(Signing_Secret__c = SECRET);
        // Changing a donation's status needs the payment permission (Payment_Fields_Locked), as the guest user has.
        User integration = new User(
            ProfileId = UserInfo.getProfileId(),
            Username = 'webhook.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Webhook',
            Email = 'webhook@example.com',
            Alias = 'webhook',
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
            insert as system campaign;
            insert as system new List<Opportunity>{
                donation(campaign.Id, 'DON-AAAA0001', 'cs_one'),
                donation(campaign.Id, 'DON-AAAA0002', 'cs_two')
            };
        }
    }

    @IsTest
    static void completedPaidNoticePaysTheDonation() {
        String body = event('evt_1', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'paid', 25000);
        Assert.areEqual(200, post(body, validHeader(body)));

        Opportunity paid = byReference('DON-AAAA0001');
        Assert.areEqual('Paid', paid.StageName, 'US-16 AC1');
        Assert.areEqual(250, paid.Amount, 'The amount comes from the signed notice, in pesos');
        Assert.areEqual('Webhook', paid.Confirmation_Source__c, 'US-15 AC1');
        Assert.areEqual('Accepted', [SELECT Result__c FROM Payment_Notice__c WHERE Stripe_Event_Id__c = 'evt_1'].Result__c);
    }

    @IsTest
    static void unpaidCompletedNoticeLeavesItPending() {
        String body = event('evt_2', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'unpaid', 25000);
        post(body, validHeader(body));

        Assert.areEqual('Pending', byReference('DON-AAAA0001').StageName, 'US-16 AC2, US-14 AC6');
    }

    @IsTest
    static void expiredNoticeExpiresTheDonation() {
        String body = event('evt_3', 'checkout.session.expired', 'DON-AAAA0001', 'cs_one', 'unpaid', 25000);
        post(body, validHeader(body));

        Assert.areEqual('Expired', byReference('DON-AAAA0001').StageName);
    }

    @IsTest
    static void fakeNoticeIsRejectedAndShownToStaff() {
        String body = event('evt_4', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'paid', 25000);
        Assert.areEqual(400, post(body, 't=' + now() + ',v1=' + 'deadbeef'), 'US-17 AC1: bad signature');
        Assert.areEqual(400, post(body, null), 'US-17 AC1: unsigned');

        Assert.areEqual('Pending', byReference('DON-AAAA0001').StageName, 'The donation does not change');
        Assert.areEqual(2, [SELECT COUNT() FROM Payment_Notice__c WHERE Result__c = 'Rejected' AND Rejection_Reason__c != null]);
    }

    @IsTest
    static void signedButUnreadableBodyIsRejected() {
        String body = '{"id":"evt_x"}';
        Assert.areEqual(400, post(body, validHeader(body)));
        Assert.areEqual(1, [SELECT COUNT() FROM Payment_Notice__c WHERE Result__c = 'Rejected']);
    }

    @IsTest
    static void oldSignatureIsRejected() {
        String body = event('evt_5', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'paid', 25000);
        String old = String.valueOf(now() - 3600);
        Assert.areEqual(400, post(body, 't=' + old + ',v1=' + StripeWebhook.sign(old, body, SECRET)), 'A replayed notice');
    }

    @IsTest
    static void repeatedNoticeIsIgnored() {
        String body = event('evt_6', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'paid', 25000);
        post(body, validHeader(body));
        Integer emails = Limits.getEmailInvocations();
        post(body, validHeader(body));

        Assert.areEqual(1, [SELECT COUNT() FROM Payment_Notice__c WHERE Stripe_Event_Id__c = 'evt_6'], 'US-17 AC2');
        Assert.areEqual(emails, Limits.getEmailInvocations(), 'No second receipt');
    }

    @IsTest
    static void twoPaymentsAreTwoDonations() {
        String one = event('evt_7', 'checkout.session.completed', 'DON-AAAA0001', 'cs_one', 'paid', 10000);
        String two = event('evt_8', 'checkout.session.completed', 'DON-AAAA0002', 'cs_two', 'paid', 10000);
        post(one, validHeader(one));
        post(two, validHeader(two));

        Assert.areEqual(2, [SELECT COUNT() FROM Opportunity WHERE StageName = 'Paid'], 'US-16 AC3, US-17 AC3');
    }

    @IsTest
    static void noticeForUnknownDonationIsRejected() {
        String body = event('evt_9', 'checkout.session.completed', 'DON-NOPE0000', 'cs_none', 'paid', 25000);
        post(body, validHeader(body));

        Payment_Notice__c notice = [SELECT Result__c, Donation__c FROM Payment_Notice__c WHERE Stripe_Event_Id__c = 'evt_9'];
        Assert.areEqual('Rejected', notice.Result__c, 'US-17 AC4');
        Assert.isNull(notice.Donation__c);
    }

    private static Opportunity donation(Id campaignId, String reference, String sessionId) {
        return new Opportunity(
            Name = reference,
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            CampaignId = campaignId,
            StageName = 'Pending',
            Amount = 100,
            CloseDate = Date.today(),
            Donation_Reference__c = reference,
            Stripe_Session_Id__c = sessionId,
            Donor_Email__c = 'donante@example.com',
            Is_Anonymous__c = true
        );
    }

    private static Opportunity byReference(String reference) {
        return [SELECT StageName, Amount, Confirmation_Source__c FROM Opportunity WHERE Donation_Reference__c = :reference];
    }

    private static String event(String id, String type, String reference, String sessionId, String paymentStatus, Integer cents) { // NOPMD
        return JSON.serialize(new Map<String, Object>{
            'id' => id,
            'type' => type,
            'data' => new Map<String, Object>{
                'object' => new Map<String, Object>{
                    'id' => sessionId,
                    'client_reference_id' => reference,
                    'payment_status' => paymentStatus,
                    'amount_total' => cents,
                    'payment_intent' => 'pi_' + id
                }
            }
        });
    }

    private static Long now() {
        return Datetime.now().getTime() / 1000;
    }

    private static String validHeader(String body) {
        String timestamp = String.valueOf(now());
        return 't=' + timestamp + ',v1=' + StripeWebhook.sign(timestamp, body, SECRET);
    }

    // Posts like Stripe does, as the integration user, and returns the HTTP status.
    private static Integer post(String body, String signatureHeader) {
        RestRequest request = new RestRequest();
        request.requestUri = '/services/apexrest/stripe/webhook';
        request.httpMethod = 'POST';
        request.requestBody = Blob.valueOf(body);
        if (signatureHeader != null) {
            request.addHeader('Stripe-Signature', signatureHeader);
        }
        RestContext.request = request;
        RestContext.response = new RestResponse();
        System.runAs([SELECT Id FROM User WHERE Alias = 'webhook'][0]) {
            StripeWebhook.receive();
        }
        return RestContext.response.statusCode;
    }
}
