/**
 * Payment gateway the donation flow depends on (US-03, US-04). StripeClient implements it, and
 * DonationCheckoutService receives it as a dependency: tests swap in a fake, and another gateway
 * would only need a new subclass. Amounts are in MXN.
 */
public abstract class PaymentGateway {

    /**
     * @description Creates a hosted checkout for one donation.
     * @param request what to charge and where to send the donor back
     * @return the new session, with the URL to send the donor to
     */
    public abstract CheckoutSession createCheckoutSession(CheckoutRequest request);

    /**
     * @description Reads the current state of a checkout session.
     * @param sessionId the gateway's session id
     * @return the session, saying whether it was paid or expired
     */
    public abstract CheckoutSession getCheckoutSession(String sessionId);

    /**
     * @description What the gateway must charge for one donation.
     */
    public class CheckoutRequest {
        public String reference;
        public Decimal amount;
        public String description;
        public Datetime expiresAt;
        public String successUrl;
        public String cancelUrl;
        public Map<String, String> metadata = new Map<String, String>();
    }

    /**
     * @description A checkout session, as the donation flow needs it.
     */
    public class CheckoutSession {
        public String id;
        public String url;
        public Boolean paid = false;
        public Boolean expired = false;
        public Decimal amount;
        public String paymentId;
    }

    /**
     * @description The gateway could not be reached or rejected the request.
     */
    public class GatewayException extends Exception {}
}
