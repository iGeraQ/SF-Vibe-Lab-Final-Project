@IsTest
private class DonationCheckoutServiceTest {

    private static PaymentGateway.CheckoutRequest sentRequest;
    private static String requestedSessionId;

    // Stands in for StripeClient (tested in StripeClientTest). Answers per session id, or with the '*' session;
    // no session means the gateway fails.
    private class FakeGateway extends PaymentGateway {
        private final Map<String, PaymentGateway.CheckoutSession> sessions;

        FakeGateway(PaymentGateway.CheckoutSession session) {
            this(new Map<String, PaymentGateway.CheckoutSession>{ '*' => session });
        }

        FakeGateway(Map<String, PaymentGateway.CheckoutSession> sessions) {
            this.sessions = sessions;
        }

        /**
         * @description Keeps the request and answers with the canned session.
         * @param request the checkout the service asked for
         * @return the canned session
         */
        public override PaymentGateway.CheckoutSession createCheckoutSession(PaymentGateway.CheckoutRequest request) {
            sentRequest = request;
            return answer('*');
        }

        /**
         * @description Keeps the session id and answers with the canned session.
         * @param sessionId the session the service asked for
         * @return the canned session
         */
        public override PaymentGateway.CheckoutSession getCheckoutSession(String sessionId) {
            requestedSessionId = sessionId;
            return answer(sessionId);
        }

        private PaymentGateway.CheckoutSession answer(String sessionId) {
            PaymentGateway.CheckoutSession session = sessions.containsKey(sessionId) ? sessions.get(sessionId) : sessions.get('*');
            if (session == null) {
                throw new PaymentGateway.GatewayException('Gateway down');
            }
            return session;
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
            Campaign open = campaign('Abierta');
            Campaign closed = campaign('Cerrada');
            closed.IsActive = false;
            // as system: the new fields have no field access on any profile until a permission set grants it.
            insert as system new List<Campaign>{ open, closed };
            insert as system new List<Opportunity>{
                savedDonation(open.Id, 'cs_paid', 'Pending'),
                savedDonation(open.Id, 'cs_open', 'Pending'),
                savedDonation(open.Id, 'cs_expired', 'Pending'),
                savedDonation(open.Id, 'cs_done', 'Paid')
            };
        }
    }

    @IsTest
    static void startCheckoutSavesPendingDonationAndReturnsGatewayUrl() {
        String url = checkout(credited(250), newSession());

        Assert.areEqual('https://checkout.example.com/cs_test_new', url);
        Opportunity donation = newDonation();
        Assert.areEqual('Pending', donation.StageName);
        Assert.areEqual(250, donation.Amount);
        Assert.areEqual(campaignId('Abierta'), donation.CampaignId);
        Assert.isTrue(donation.Donation_Reference__c.startsWith('DON-'), donation.Donation_Reference__c);
        Assert.isNotNull(donation.Stripe_Session_Expires_At__c);
        Assert.areEqual('Familia Prueba', donation.Public_Name__c);
    }

    @IsTest
    static void startCheckoutSendsTheDonationToTheGateway() {
        checkout(credited(250), newSession());

        Opportunity donation = newDonation();
        Assert.areEqual(donation.Donation_Reference__c, sentRequest.reference);
        Assert.areEqual(250, sentRequest.amount);
        Assert.areEqual('Donación · Abierta', sentRequest.description);
        Assert.areEqual(donation.Stripe_Session_Expires_At__c, sentRequest.expiresAt);
        Assert.areEqual(System.Label.Stripe_Success_Url, sentRequest.successUrl);
        Assert.areEqual(System.Label.Stripe_Cancel_Url, sentRequest.cancelUrl);
        Assert.areEqual(String.valueOf(campaignId('Abierta')), sentRequest.metadata.get('campaign_id'));
        Assert.areEqual('false', sentRequest.metadata.get('anonymous'));
    }

    @IsTest
    static void anonymousDonationStoresNoNames() {
        DonationCheckoutService.DonationRequest request = credited(100);
        request.anonymous = true;

        checkout(request, newSession());

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

        checkout(request, newSession());

        Opportunity donation = newDonation();
        Assert.areEqual('Familia Prueba', donation.Public_Name__c, 'HTML tags and spaces are removed');
        Assert.areEqual('XAXX010101000', donation.RFC__c);
        Assert.isTrue(donation.Invoice_Consent__c);
        Assert.isNotNull(donation.Invoice_Consent_Date__c);
    }

    @IsTest
    static void closedCampaignIsRejectedWithoutCallingTheGateway() {
        DonationCheckoutService.DonationRequest request = credited(250);
        request.campaignId = campaignId('Cerrada');

        String message = checkoutError(request, newSession());

        Assert.areEqual('Esta campaña ya no recibe donaciones.', message);
        Assert.isNull(sentRequest, 'The gateway is not called');
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void amountBelowMinimumIsRejected() {
        String message = checkoutError(credited(5), newSession());

        Assert.areEqual('El monto mínimo es de $10 MXN.', message);
        Assert.isNull(sentRequest, 'The gateway is not called');
    }

    @IsTest
    static void gatewayErrorSavesNothing() {
        String message = checkoutError(credited(250), null);

        Assert.areEqual('No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.', message);
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void validationRuleMessageReachesTheDonor() {
        DonationCheckoutService.DonationRequest request = credited(250);
        request.publicName = null;

        String message = checkoutError(request, newSession());

        Assert.areEqual('Escribe el nombre que quieres que aparezca públicamente.', message);
        Assert.areEqual(0, newDonationCount());
    }

    @IsTest
    static void confirmMarksPaidWithTheGatewayAmount() {
        PaymentGateway.CheckoutSession paid = session('cs_paid');
        paid.paid = true;
        paid.amount = 300;
        paid.paymentId = 'pi_test_1';

        String status = confirm('cs_paid', paid);

        Assert.areEqual('Paid', status);
        Assert.areEqual('cs_paid', requestedSessionId);
        Opportunity donation = donationBySession('cs_paid');
        Assert.areEqual('Paid', donation.StageName);
        Assert.areEqual(300, donation.Amount, 'The amount comes from the gateway, not from the form');
        Assert.areEqual('pi_test_1', donation.Stripe_Payment_Intent_Id__c);
        Assert.areEqual('Return_Page', donation.Confirmation_Source__c);
    }

    @IsTest
    static void confirmKeepsUnpaidSessionPending() {
        Assert.areEqual('Pending', confirm('cs_open', session('cs_open')));
        Assert.areEqual('Pending', donationBySession('cs_open').StageName);
    }

    @IsTest
    static void confirmMarksExpiredSession() {
        PaymentGateway.CheckoutSession expired = session('cs_expired');
        expired.expired = true;

        Assert.areEqual('Expired', confirm('cs_expired', expired));
        Assert.areEqual('Expired', donationBySession('cs_expired').StageName);
    }

    @IsTest
    static void confirmOfUnknownSessionFails() {
        String message;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(session('cs_unknown'));
            try {
                DonationCheckoutService.confirmCheckout('cs_unknown');
            } catch (AuraHandledException e) {
                message = e.getMessage();
            }
        }

        Assert.areEqual('No encontramos tu donación.', message);
        Assert.isNull(requestedSessionId, 'The gateway is not asked about a session that is not ours');
    }

    @IsTest
    static void confirmOfFinishedDonationDoesNotCallTheGateway() {
        Assert.areEqual('Paid', confirm('cs_done', session('cs_done')));
        Assert.isNull(requestedSessionId);
    }

    @IsTest
    static void applyGatewayStatusSavesPaidAndExpiredDonationsInOneBatch() {
        PaymentGateway.CheckoutSession paid = session('cs_paid');
        paid.paid = true;
        paid.amount = 300;
        PaymentGateway.CheckoutSession expired = session('cs_expired');
        expired.expired = true;

        List<Opportunity> changed = applyGatewayStatus(new Map<String, PaymentGateway.CheckoutSession>{
            'cs_paid' => paid, 'cs_expired' => expired, 'cs_open' => session('cs_open')
        });

        Assert.areEqual(2, changed.size(), 'The open session has nothing to change yet');
        Opportunity paidDonation = donationBySession('cs_paid');
        Assert.areEqual('Paid', paidDonation.StageName);
        Assert.areEqual(300, paidDonation.Amount);
        Assert.areEqual('Scheduled_Check', paidDonation.Confirmation_Source__c);
        Assert.areEqual('Expired', donationBySession('cs_expired').StageName);
        Assert.areEqual('Pending', donationBySession('cs_open').StageName);
    }

    @IsTest
    static void applyGatewayStatusLeavesUnreadableSessionsPending() {
        PaymentGateway.CheckoutSession paid = session('cs_paid');
        paid.paid = true;
        paid.amount = 300;

        // cs_open and cs_expired have no answer, so the fake gateway fails for them.
        List<Opportunity> changed = applyGatewayStatus(new Map<String, PaymentGateway.CheckoutSession>{ 'cs_paid' => paid });

        Assert.areEqual(1, changed.size());
        Assert.areEqual('Paid', donationBySession('cs_paid').StageName);
        Assert.areEqual('Pending', donationBySession('cs_open').StageName, 'It is asked again on the next run');
        Assert.areEqual('Pending', donationBySession('cs_expired').StageName);
    }

    @IsTest
    static void applyGatewayStatusSkipsFinishedDonations() {
        List<Opportunity> done = [SELECT Id, StageName, Stripe_Session_Id__c FROM Opportunity WHERE Stripe_Session_Id__c = 'cs_done' WITH SYSTEM_MODE];
        List<Opportunity> changed;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(session('cs_done'));
            changed = DonationCheckoutService.applyGatewayStatus(done, 'Scheduled_Check');
        }

        Assert.areEqual(0, changed.size());
        Assert.isNull(requestedSessionId, 'A paid donation is not asked about again');
    }

    private static List<Opportunity> applyGatewayStatus(Map<String, PaymentGateway.CheckoutSession> answers) {
        List<Opportunity> pending = [
            SELECT Id, StageName, Stripe_Session_Id__c
            FROM Opportunity
            WHERE Stripe_Session_Id__c IN ('cs_paid', 'cs_open', 'cs_expired')
            WITH SYSTEM_MODE
        ];
        List<Opportunity> changed;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(answers);
            changed = DonationCheckoutService.applyGatewayStatus(pending, 'Scheduled_Check');
        }
        return changed;
    }

    private static String checkout(DonationCheckoutService.DonationRequest request, PaymentGateway.CheckoutSession answer) {
        String url;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(answer);
            url = DonationCheckoutService.startCheckout(request);
        }
        return url;
    }

    private static String checkoutError(DonationCheckoutService.DonationRequest request, PaymentGateway.CheckoutSession answer) {
        String message;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(answer);
            try {
                DonationCheckoutService.startCheckout(request);
            } catch (AuraHandledException e) {
                message = e.getMessage();
            }
        }
        Assert.isNotNull(message, 'Expected an error for the donor');
        return message;
    }

    private static String confirm(String sessionId, PaymentGateway.CheckoutSession answer) {
        String status;
        System.runAs(integrationUser()) {
            DonationCheckoutService.gateway = new FakeGateway(answer);
            status = DonationCheckoutService.confirmCheckout(sessionId);
        }
        return status;
    }

    private static PaymentGateway.CheckoutSession newSession() {
        PaymentGateway.CheckoutSession created = session('cs_test_new');
        created.url = 'https://checkout.example.com/cs_test_new';
        return created;
    }

    private static PaymentGateway.CheckoutSession session(String id) {
        PaymentGateway.CheckoutSession result = new PaymentGateway.CheckoutSession();
        result.id = id;
        result.paid = false;
        result.expired = false;
        return result;
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
            WITH SYSTEM_MODE
        ];
    }

    private static Integer newDonationCount() {
        return [SELECT COUNT() FROM Opportunity WHERE Donation_Reference__c != NULL WITH SYSTEM_MODE];
    }

    private static Opportunity donationBySession(String sessionId) {
        return [
            SELECT StageName, Amount, Stripe_Payment_Intent_Id__c, Confirmation_Source__c
            FROM Opportunity
            WHERE Stripe_Session_Id__c = :sessionId
            WITH SYSTEM_MODE
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
