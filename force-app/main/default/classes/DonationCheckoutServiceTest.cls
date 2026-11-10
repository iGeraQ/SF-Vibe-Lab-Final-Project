@IsTest
private class DonationCheckoutServiceTest {

    private static final String NEW_SESSION = '{"id":"cs_test_new","url":"https://checkout.stripe.com/c/pay/cs_test_new","status":"open","payment_status":"unpaid"}';
    private static final String PAID_SESSION = '{"id":"cs_paid","status":"complete","payment_status":"paid","amount_total":30000,"payment_intent":"pi_test_1"}';
    private static final String OPEN_SESSION = '{"id":"cs_open","status":"open","payment_status":"unpaid"}';
    private static final String EXPIRED_SESSION = '{"id":"cs_expired","status":"expired","payment_status":"unpaid"}';

    private static HttpRequest lastRequest;

    private class StripeMock implements HttpCalloutMock {
        private final Integer status;
        private final String body;

        StripeMock(Integer status, String body) {
            this.status = status;
            this.body = body;
        }

        /**
         * @description Answers like Stripe and keeps the request for the asserts.
         * @param request the callout
         * @return the canned response
         */
        public HttpResponse respond(HttpRequest request) {
            lastRequest = request;
            HttpResponse response = new HttpResponse();
            response.setStatusCode(status);
            response.setBody(body);
            return response;
        }
    }

    @TestSetup
    static void setup() {
        // Changing a donation's status needs the payment permission (Payment_Fields_Locked), as the guest user has.
        User integration = new User(
            ProfileId = UserInfo.getProfileId(),
            Username = 'checkout.' + UserInfo.getOrganizationId() + '@example.com',
            LastName = 'Checkout',
            Email = 'checkout@example.com',
            Alias = 'checkout',
            TimeZoneSidKey = 'America/Merida',
            LocaleSidKey = 'es_MX',
            EmailEncodingKey = 'UTF-8',
            LanguageLocaleKey = 'es'
        );
        System.runAs(new User(Id = UserInfo.getUserId())) {
            insert integration;
            insert new PermissionSetAssignment(
                AssigneeId = integration.Id,
                PermissionSetId = [SELECT Id FROM PermissionSet WHERE Name = 'Donations_Payment_Integration'].Id
            );
        }

        System.runAs(integration) {
            Campaign open = campaign('Abierta');
            Campaign closed = campaign('Cerrada');
            closed.IsActive = false;
            insert new List<Campaign>{ open, closed };
            // Donations already waiting for Stripe, created here so the tests make no DML before their callouts.
            insert new List<Opportunity>{
                savedDonation(open.Id, 'cs_paid', 'Pending'),
                savedDonation(open.Id, 'cs_open', 'Pending'),
                savedDonation(open.Id, 'cs_expired', 'Pending'),
                savedDonation(open.Id, 'cs_done', 'Paid')
            };
        }
    }

    @IsTest
    static void startCheckoutSavesPendingDonationAndReturnsStripeUrl() {
        String url = checkout(credited(250), new StripeMock(200, NEW_SESSION));

        Assert.areEqual('https://checkout.stripe.com/c/pay/cs_test_new', url);
        Opportunity donation = newDonation();
        Assert.areEqual('Pending', donation.StageName);
        Assert.areEqual(250, donation.Amount);
        Assert.areEqual(campaignId('Abierta'), donation.CampaignId);
        Assert.isTrue(donation.Donation_Reference__c.startsWith('DON-'), donation.Donation_Reference__c);
        Assert.isNotNull(donation.Stripe_Session_Expires_At__c);
        Assert.areEqual('Familia Prueba', donation.Public_Name__c);
    }

    @IsTest
    static void startCheckoutSendsAmountCurrencyAndReferenceToStripe() {
        checkout(credited(250), new StripeMock(200, NEW_SESSION));

        String reference = newDonation().Donation_Reference__c;
        String body = EncodingUtil.urlDecode(lastRequest.getBody(), 'UTF-8');
        Assert.areEqual('callout:Stripe/v1/checkout/sessions', lastRequest.getEndpoint());
        Assert.areEqual(reference, lastRequest.getHeader('Idempotency-Key'));
        Assert.isTrue(body.contains('line_items[0][price_data][currency]=mxn'), body);
        Assert.isTrue(body.contains('line_items[0][price_data][unit_amount]=25000'), body);
        Assert.isTrue(body.contains('locale=es-419'), body);
        Assert.isTrue(body.contains('client_reference_id=' + reference), body);
        Assert.isTrue(body.contains('session_id={CHECKOUT_SESSION_ID}'), body);
    }

    @IsTest
    static void anonymousDonationStoresNoNames() {
        DonationCheckoutService.DonationRequest request = credited(100);
        request.anonymous = true;

        checkout(request, new StripeMock(200, NEW_SESSION));

        Opportunity donation = newDonation();
        Assert.isTrue(donation.Is_Anonymous__c);
        Assert.isNull(donation.Public_Name__c, 'An anonymous donation never stores a public name');
        Assert.isNull(donation.Donor_First_Name__c);
        Assert.areEqual('donante@example.com', donation.Donor_Email__c);
    }

    @IsTest
    static void invoiceDataIsCleanedBeforeSaving() {
        DonationCheckoutService.DonationRequest request = credited(500);
        request.publicName = ' <b>Familia</b> Prueba ';
        request.invoice = true;
        request.personType = 'Individual';
        request.rfc = ' xaxx010101000 ';
        request.invoiceConsent = true;

        checkout(request, new StripeMock(200, NEW_SESSION));

        Opportunity donation = newDonation();
        Assert.areEqual('Familia Prueba', donation.Public_Name__c, 'HTML tags and spaces are removed');
        Assert.areEqual('XAXX010101000', donation.RFC__c);
        Assert.isTrue(donation.Invoice_Consent__c);
        Assert.isNotNull(donation.Invoice_Consent_Date__c);
    }

    @IsTest
    static void closedCampaignIsRejectedWithoutCallingStripe() {
        DonationCheckoutService.DonationRequest request = credited(250);
        request.campaignId = campaignId('Cerrada');

        String message = checkoutError(request, new StripeMock(200, NEW_SESSION));

        Assert.areEqual('Esta campaña ya no recibe donaciones.', message);
        Assert.isNull(lastRequest, 'Stripe is not called');
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void amountBelowStripeMinimumIsRejected() {
        String message = checkoutError(credited(5), new StripeMock(200, NEW_SESSION));

        Assert.areEqual('El monto mínimo es de $10 MXN.', message);
        Assert.isNull(lastRequest, 'Stripe is not called');
    }

    @IsTest
    static void stripeErrorSavesNothing() {
        String message = checkoutError(credited(250), new StripeMock(400, '{"error":{"message":"Invalid request"}}'));

        Assert.areEqual('No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.', message);
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void validationRuleMessageReachesTheDonor() {
        DonationCheckoutService.DonationRequest request = credited(250);
        request.publicName = null;

        String message = checkoutError(request, new StripeMock(200, NEW_SESSION));

        Assert.areEqual('Escribe el nombre que quieres que aparezca públicamente.', message);
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void confirmMarksPaidWithStripeAmount() {
        String status = confirm('cs_paid', new StripeMock(200, PAID_SESSION));

        Assert.areEqual('Paid', status);
        Opportunity donation = donationBySession('cs_paid');
        Assert.areEqual('Paid', donation.StageName);
        Assert.areEqual(300, donation.Amount, 'The amount comes from Stripe, not from the form');
        Assert.areEqual('pi_test_1', donation.Stripe_Payment_Intent_Id__c);
        Assert.areEqual('Return_Page', donation.Confirmation_Source__c);
        Assert.areEqual('callout:Stripe/v1/checkout/sessions/cs_paid', lastRequest.getEndpoint());
    }

    @IsTest
    static void confirmKeepsUnpaidSessionPending() {
        Assert.areEqual('Pending', confirm('cs_open', new StripeMock(200, OPEN_SESSION)));
        Assert.areEqual('Pending', donationBySession('cs_open').StageName);
    }

    @IsTest
    static void confirmMarksExpiredSession() {
        Assert.areEqual('Expired', confirm('cs_expired', new StripeMock(200, EXPIRED_SESSION)));
        Assert.areEqual('Expired', donationBySession('cs_expired').StageName);
    }

    @IsTest
    static void confirmOfUnknownSessionFails() {
        String message;
        System.runAs(integrationUser()) {
            Test.setMock(HttpCalloutMock.class, new StripeMock(200, PAID_SESSION));
            Test.startTest();
            try {
                DonationCheckoutService.confirmCheckout('cs_unknown');
            } catch (AuraHandledException e) {
                message = e.getMessage();
            }
            Test.stopTest();
        }

        Assert.areEqual('No encontramos tu donación.', message);
        Assert.isNull(lastRequest, 'Stripe is not called for a session that is not ours');
    }

    @IsTest
    static void confirmOfFinishedDonationDoesNotCallStripe() {
        Assert.areEqual('Paid', confirm('cs_done', new StripeMock(200, EXPIRED_SESSION)));
        Assert.isNull(lastRequest);
    }

    private static String checkout(DonationCheckoutService.DonationRequest request, StripeMock mock) {
        String url;
        System.runAs(integrationUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            url = DonationCheckoutService.startCheckout(request);
            Test.stopTest();
        }
        return url;
    }

    private static String checkoutError(DonationCheckoutService.DonationRequest request, StripeMock mock) {
        String message;
        System.runAs(integrationUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            try {
                DonationCheckoutService.startCheckout(request);
            } catch (AuraHandledException e) {
                message = e.getMessage();
            }
            Test.stopTest();
        }
        Assert.isNotNull(message, 'Expected an error for the donor');
        return message;
    }

    private static String confirm(String sessionId, StripeMock mock) {
        String status;
        System.runAs(integrationUser()) {
            Test.setMock(HttpCalloutMock.class, mock);
            Test.startTest();
            status = DonationCheckoutService.confirmCheckout(sessionId);
            Test.stopTest();
        }
        return status;
    }

    private static DonationCheckoutService.DonationRequest credited(Decimal amount) {
        DonationCheckoutService.DonationRequest request = new DonationCheckoutService.DonationRequest();
        request.campaignId = campaignId('Abierta');
        request.amount = amount;
        request.anonymous = false;
        request.invoice = false;
        request.email = 'donante@example.com';
        request.firstName = 'Zacarias';
        request.lastName = 'Prueba';
        request.publicName = 'Familia Prueba';
        return request;
    }

    private static Opportunity newDonation() {
        return [
            SELECT StageName, Amount, CampaignId, Donation_Reference__c, Stripe_Session_Expires_At__c, Public_Name__c,
                Is_Anonymous__c, Donor_First_Name__c, Donor_Email__c, RFC__c, Invoice_Consent__c, Invoice_Consent_Date__c
            FROM Opportunity
            WHERE Stripe_Session_Id__c = 'cs_test_new'
        ];
    }

    private static Integer newDonationCount() {
        return [SELECT COUNT() FROM Opportunity WHERE Donation_Reference__c != NULL];
    }

    private static Opportunity donationBySession(String sessionId) {
        return [
            SELECT StageName, Amount, Stripe_Payment_Intent_Id__c, Confirmation_Source__c
            FROM Opportunity
            WHERE Stripe_Session_Id__c = :sessionId
        ];
    }

    private static User integrationUser() {
        return [SELECT Id FROM User WHERE Username = :('checkout.' + UserInfo.getOrganizationId() + '@example.com')];
    }

    private static Id campaignId(String name) {
        return [SELECT Id FROM Campaign WHERE Name = :name].Id;
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

    private static Opportunity savedDonation(Id campaignId, String sessionId, String stage) {
        return new Opportunity(
            Name = 'Donación de prueba',
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            CampaignId = campaignId,
            StageName = stage,
            Amount = 250,
            CloseDate = Date.today(),
            Is_Anonymous__c = true,
            Donor_Email__c = 'donante@example.com',
            Stripe_Session_Id__c = sessionId
        );
    }
}
