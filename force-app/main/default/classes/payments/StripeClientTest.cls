@IsTest
private class StripeClientTest {

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

    @IsTest
    static void createCheckoutSessionPostsTheDonationToStripe() {
        Test.setMock(HttpCalloutMock.class, new StripeMock(200,
            '{"id":"cs_test_new","url":"https://checkout.stripe.com/c/pay/cs_test_new","status":"open","payment_status":"unpaid"}'));
        PaymentGateway.CheckoutRequest request = new PaymentGateway.CheckoutRequest();
        request.reference = 'DON-0A1B2C3D';
        request.amount = 250;
        request.description = 'Donación · Activa';
        request.expiresAt = Datetime.newInstanceGmt(2030, 1, 1, 0, 0, 0);
        request.successUrl = 'https://example.com/gracias';
        request.cancelUrl = 'https://example.com/cancelada';
        request.metadata = new Map<String, String>{ 'campaign' => 'Activa' };

        PaymentGateway.CheckoutSession session = new StripeClient().createCheckoutSession(request);

        Assert.areEqual('cs_test_new', session.id);
        Assert.areEqual('https://checkout.stripe.com/c/pay/cs_test_new', session.url);
        Assert.isFalse(session.paid);
        Assert.areEqual('POST', lastRequest.getMethod());
        Assert.areEqual('callout:Stripe/v1/checkout/sessions', lastRequest.getEndpoint());
        Assert.areEqual('DON-0A1B2C3D', lastRequest.getHeader('Idempotency-Key'), 'A retried submit makes one session');
        String body = EncodingUtil.urlDecode(lastRequest.getBody(), 'UTF-8');
        for (String expected : new List<String>{
            'mode=payment',
            'locale=es-419',
            'client_reference_id=DON-0A1B2C3D',
            'line_items[0][price_data][currency]=mxn',
            'line_items[0][price_data][unit_amount]=25000',
            'line_items[0][price_data][product_data][name]=Donación · Activa',
            'metadata[campaign]=Activa',
            'payment_intent_data[metadata][donation_reference]=DON-0A1B2C3D',
            'payment_intent_data[description]=DON-0A1B2C3D · Donación · Activa',
            'expires_at=1893456000',
            'success_url=https://example.com/gracias?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url=https://example.com/cancelada'
        }) {
            Assert.isTrue(body.contains(expected), 'Missing ' + expected + ' in ' + body);
        }
    }

    @IsTest
    static void getCheckoutSessionReadsAPaidSession() {
        Test.setMock(HttpCalloutMock.class, new StripeMock(200,
            '{"id":"cs_paid","status":"complete","payment_status":"paid","amount_total":30000,"payment_intent":"pi_test_1"}'));

        PaymentGateway.CheckoutSession session = new StripeClient().getCheckoutSession('cs_paid');

        Assert.areEqual('GET', lastRequest.getMethod());
        Assert.areEqual('callout:Stripe/v1/checkout/sessions/cs_paid', lastRequest.getEndpoint());
        Assert.isTrue(session.paid);
        Assert.isFalse(session.expired);
        Assert.areEqual(300, session.amount, 'Stripe sends cents');
        Assert.areEqual('pi_test_1', session.paymentId);
    }

    @IsTest
    static void getCheckoutSessionReadsAnExpiredSession() {
        Test.setMock(HttpCalloutMock.class, new StripeMock(200, '{"id":"cs_expired","status":"expired","payment_status":"unpaid"}'));

        PaymentGateway.CheckoutSession session = new StripeClient().getCheckoutSession('cs_expired');

        Assert.isTrue(session.expired);
        Assert.isFalse(session.paid);
        Assert.isNull(session.amount);
    }

    @IsTest
    static void stripeErrorThrowsGatewayException() {
        Test.setMock(HttpCalloutMock.class, new StripeMock(400, '{"error":{"message":"Invalid request"}}'));

        try {
            new StripeClient().getCheckoutSession('cs_bad');
            Assert.fail('Expected a GatewayException');
        } catch (PaymentGateway.GatewayException e) {
            Assert.isTrue(e.getMessage().contains('400'), e.getMessage());
        }
    }
}
