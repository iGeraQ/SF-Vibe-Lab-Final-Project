/**
 * Stripe implementation of PaymentGateway (test mode only). It calls Stripe through the Stripe Named Credential,
 * so the key never appears in Apex or in the repo: it lives in the External Credential in Setup (#49).
 */
public inherited sharing class StripeClient extends PaymentGateway {

    private static final String SESSIONS = 'callout:Stripe/v1/checkout/sessions';

    /**
     * @description Creates a Stripe Checkout Session in MXN, in Spanish (US-03).
     * @param request what to charge and where to send the donor back
     * @return the new session, with Stripe's payment URL
     */
    public override PaymentGateway.CheckoutSession createCheckoutSession(PaymentGateway.CheckoutRequest request) {
        Map<String, String> form = new Map<String, String>{
            'mode' => 'payment',
            'locale' => 'es-419',
            'client_reference_id' => request.reference,
            'line_items[0][quantity]' => '1',
            'line_items[0][price_data][currency]' => 'mxn',
            'line_items[0][price_data][unit_amount]' => String.valueOf((request.amount * 100).setScale(0)),
            'line_items[0][price_data][product_data][name]' => request.description,
            // The payment carries the reference too, so staff find the donation from the payment in Stripe (US-03 AC2).
            'payment_intent_data[metadata][donation_reference]' => request.reference,
            'payment_intent_data[description]' => request.reference + ' · ' + request.description,
            'expires_at' => String.valueOf(request.expiresAt.getTime() / 1000),
            'success_url' => request.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => request.cancelUrl
        };
        for (String key : request.metadata.keySet()) {
            form.put('metadata[' + key + ']', request.metadata.get(key));
        }
        HttpRequest call = newRequest('POST', SESSIONS);
        call.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        // The reference as Idempotency-Key: a retried submit makes one session, not two.
        call.setHeader('Idempotency-Key', request.reference);
        call.setBody(encode(form));
        return toSession(send(call));
    }

    /**
     * @description Reads a Stripe Checkout Session (US-04).
     * @param sessionId the Checkout Session id
     * @return the session, saying whether it was paid or expired
     */
    public override PaymentGateway.CheckoutSession getCheckoutSession(String sessionId) {
        return toSession(send(newRequest('GET', SESSIONS + '/' + EncodingUtil.urlEncode(sessionId, 'UTF-8'))));
    }

    private static HttpRequest newRequest(String method, String endpoint) {
        HttpRequest request = new HttpRequest();
        request.setMethod(method);
        request.setEndpoint(endpoint);
        return request;
    }

    private static Map<String, Object> send(HttpRequest request) {
        HttpResponse response;
        try {
            response = new Http().send(request);
        } catch (CalloutException e) {
            throw new PaymentGateway.GatewayException('Stripe could not be reached: ' + e.getMessage(), e);
        }
        if (response.getStatusCode() != 200) {
            throw new PaymentGateway.GatewayException('Stripe answered ' + response.getStatusCode());
        }
        return (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
    }

    private static String encode(Map<String, String> form) {
        List<String> pairs = new List<String>();
        for (String key : form.keySet()) {
            pairs.add(key + '=' + EncodingUtil.urlEncode(form.get(key), 'UTF-8'));
        }
        return String.join(pairs, '&');
    }

    private static PaymentGateway.CheckoutSession toSession(Map<String, Object> body) {
        PaymentGateway.CheckoutSession session = new PaymentGateway.CheckoutSession();
        session.id = (String) body.get('id');
        session.url = (String) body.get('url');
        session.paid = 'paid'.equals(body.get('payment_status'));
        session.expired = 'expired'.equals(body.get('status'));
        // Stripe sends amounts in cents.
        Object cents = body.get('amount_total');
        session.amount = cents == null ? null : Decimal.valueOf(String.valueOf(cents)) / 100;
        session.paymentId = (String) body.get('payment_intent');
        return session;
    }
}
