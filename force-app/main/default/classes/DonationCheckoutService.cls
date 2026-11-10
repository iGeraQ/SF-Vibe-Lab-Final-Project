/**
 * Starts and confirms a donation's test payment (US-03, US-04), called by the site's guest user from the LWC.
 * The payment gateway is the only source of the payment status and amount. The guest has no access to Opportunity,
 * so the class runs without sharing and in system mode, and it only touches the donation it creates or the one
 * tied to a session.
 */
public without sharing class DonationCheckoutService {

    private static final Integer SESSION_MINUTES = 60;
    private static final Decimal MINIMUM_AMOUNT = 10;
    private static final String GATEWAY_DOWN = 'No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.';

    // The gateway is a dependency: Stripe in production, a fake in tests.
    @TestVisible
    private static PaymentGateway gateway = new StripeClient();

    /**
     * @description Creates the checkout session and saves the donation as Pending (US-03 AC1, AC2).
     * @param request the donation form
     * @return the gateway's checkout URL to send the donor to
     */
    @AuraEnabled
    public static String startCheckout(DonationRequest request) {
        String campaignName = validCampaignName(request);
        Opportunity donation = newDonation(request, campaignName);
        // The gateway goes first: Salesforce allows no callout after DML in the same transaction.
        PaymentGateway.CheckoutSession session = createSession(checkoutRequest(donation, campaignName));
        donation.Stripe_Session_Id__c = session.id;
        try {
            insert as system donation;
        } catch (DmlException e) {
            // The unused session expires on its own.
            throw error(e.getDmlMessage(0));
        }
        return session.url;
    }

    /**
     * @description Applies the gateway's status to the donation when the donor returns to the thank-you page (US-04).
     * @param sessionId the checkout session id from the thank-you page URL
     * @return the donation status: Pending, Paid or Expired
     */
    @AuraEnabled
    public static String confirmCheckout(String sessionId) {
        List<Opportunity> donations = String.isBlank(sessionId) ? new List<Opportunity>() : [
            SELECT Id, StageName
            FROM Opportunity
            WHERE Stripe_Session_Id__c = :sessionId AND RecordType.DeveloperName = 'Donation'
            WITH SYSTEM_MODE
            LIMIT 1
        ];
        if (donations.isEmpty()) {
            throw error('No encontramos tu donación.');
        }
        Opportunity donation = donations[0];
        if (donation.StageName != 'Pending') {
            return donation.StageName;
        }

        if (!applySession(donation, readSession(sessionId))) {
            return donation.StageName;
        }
        try {
            update as system donation;
        } catch (DmlException e) {
            throw error('No pudimos registrar el estado de tu pago. Lo revisaremos y te escribiremos.');
        }
        return donation.StageName;
    }

    // Returns the campaign name, or tells the donor what is wrong.
    private static String validCampaignName(DonationRequest request) {
        String campaignName = request == null ? null : openCampaignName(request.campaignId);
        if (campaignName == null) {
            throw error('Esta campaña ya no recibe donaciones.');
        }
        if (request.amount == null || request.amount < MINIMUM_AMOUNT) {
            throw error('El monto mínimo es de $10 MXN.');
        }
        return campaignName;
    }

    private static PaymentGateway.CheckoutSession createSession(PaymentGateway.CheckoutRequest request) {
        try {
            return gateway.createCheckoutSession(request);
        } catch (PaymentGateway.GatewayException e) {
            throw error(GATEWAY_DOWN);
        }
    }

    private static PaymentGateway.CheckoutSession readSession(String sessionId) {
        try {
            return gateway.getCheckoutSession(sessionId);
        } catch (PaymentGateway.GatewayException e) {
            throw error(GATEWAY_DOWN);
        }
    }

    // Copies the gateway's outcome onto the donation; false when there is nothing to change yet.
    private static Boolean applySession(Opportunity donation, PaymentGateway.CheckoutSession session) {
        if (session.paid) {
            donation.StageName = 'Paid';
            donation.Amount = session.amount;
            donation.CloseDate = Date.today();
            donation.Stripe_Payment_Intent_Id__c = session.paymentId;
            donation.Confirmation_Source__c = 'Return_Page';
            return true;
        }
        if (session.expired) {
            donation.StageName = 'Expired';
            return true;
        }
        return false;
    }

    private static Opportunity newDonation(DonationRequest request, String campaignName) {
        // ponytail: 8 random hex characters; a repeated reference fails the unique field and the donor retries.
        String reference = 'DON-' + EncodingUtil.convertToHex(Crypto.generateAesKey(128)).left(8).toUpperCase();
        Boolean consent = request.invoiceConsent == true;
        Opportunity donation = new Opportunity(
            Name = (reference + ' · ' + campaignName).left(120),
            RecordTypeId = Schema.SObjectType.Opportunity.getRecordTypeInfosByDeveloperName().get('Donation').getRecordTypeId(),
            CampaignId = request.campaignId,
            StageName = 'Pending',
            Amount = request.amount,
            CloseDate = Date.today(),
            Donation_Reference__c = reference,
            Stripe_Session_Expires_At__c = Datetime.now().addMinutes(SESSION_MINUTES),
            Is_Anonymous__c = request.anonymous == true,
            Invoice_Requested__c = request.invoice == true,
            Donor_Email__c = clean(request.email),
            Public_Name__c = clean(request.publicName),
            Donor_First_Name__c = clean(request.firstName),
            Donor_Last_Name__c = clean(request.lastName),
            Donor_Company__c = clean(request.company),
            Person_Type__c = request.personType,
            RFC__c = clean(request.rfc)?.toUpperCase(),
            Invoice_Consent__c = consent,
            Invoice_Consent_Date__c = consent ? Datetime.now() : null
        );
        // An anonymous donation never stores a public name, and keeps names only for its invoice (US-02).
        if (donation.Is_Anonymous__c) {
            donation.Public_Name__c = null;
        }
        if (donation.Is_Anonymous__c && !donation.Invoice_Requested__c) {
            donation.Donor_First_Name__c = null;
            donation.Donor_Last_Name__c = null;
            donation.Donor_Company__c = null;
        }
        if (!donation.Invoice_Requested__c) {
            donation.Person_Type__c = null;
            donation.RFC__c = null;
            donation.Invoice_Consent__c = false;
            donation.Invoice_Consent_Date__c = null;
        }
        return donation;
    }

    private static PaymentGateway.CheckoutRequest checkoutRequest(Opportunity donation, String campaignName) {
        PaymentGateway.CheckoutRequest request = new PaymentGateway.CheckoutRequest();
        request.reference = donation.Donation_Reference__c;
        request.amount = donation.Amount;
        request.description = 'Donación · ' + campaignName;
        request.expiresAt = donation.Stripe_Session_Expires_At__c;
        request.successUrl = System.Label.Stripe_Success_Url;
        request.cancelUrl = System.Label.Stripe_Cancel_Url;
        request.metadata = new Map<String, String>{
            'donation_reference' => donation.Donation_Reference__c,
            'campaign_id' => String.valueOf(donation.CampaignId),
            'anonymous' => String.valueOf(donation.Is_Anonymous__c),
            'invoice' => String.valueOf(donation.Invoice_Requested__c)
        };
        return request;
    }

    private static String openCampaignName(Id campaignId) {
        for (PublicCampaignController.CampaignView campaign : PublicCampaignController.getActiveCampaigns()) {
            if (campaign.id == campaignId) {
                return campaign.name;
            }
        }
        return null;
    }

    private static String clean(String value) {
        return String.isBlank(value) ? null : value.stripHtmlTags().trim();
    }

    private static AuraHandledException error(String message) {
        AuraHandledException e = new AuraHandledException(message);
        e.setMessage(message);
        return e;
    }

    /**
     * @description The donation form, as the LWC sends it (#23).
     */
    public class DonationRequest {
        @AuraEnabled public Id campaignId;
        @AuraEnabled public Decimal amount;
        @AuraEnabled public Boolean anonymous;
        @AuraEnabled public Boolean invoice;
        @AuraEnabled public String email;
        @AuraEnabled public String firstName;
        @AuraEnabled public String lastName;
        @AuraEnabled public String company;
        @AuraEnabled public String publicName;
        @AuraEnabled public String personType;
        @AuraEnabled public String rfc;
        @AuraEnabled public Boolean invoiceConsent;
    }
}
