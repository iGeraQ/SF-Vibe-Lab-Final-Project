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

        if (!applySession(donation, readSession(sessionId), 'Return_Page')) {
            return donation.StageName;
        }
        try {
            update as system donation;
        } catch (DmlException e) {
            throw error('No pudimos registrar el estado de tu pago. Lo revisaremos y te escribiremos.');
        }
        return donation.StageName;
    }

    /**
     * @description Applies the gateway's status to many pending donations, for the scheduled check (US-03 AC5).
     * Not exposed to the site. A session the gateway can't read stays Pending for the next run.
     * @param donations donations with Id, StageName and Stripe_Session_Id__c; anything not Pending is skipped
     * @param source the Confirmation_Source__c value for donations that turn out paid, such as Scheduled_Check
     * @return the donations whose status changed and were saved
     */
    // ponytail: one callout per donation, so callers send at most 100 donations per transaction (the callout limit).
    public static List<Opportunity> applyGatewayStatus(List<Opportunity> donations, String source) {
        List<Opportunity> changed = new List<Opportunity>();
        for (Opportunity donation : donations) {
            if (donation.StageName == 'Pending' && String.isNotBlank(donation.Stripe_Session_Id__c)
                    && applySessionIfReadable(donation, source)) {
                changed.add(donation);
            }
        }
        List<Opportunity> saved = new List<Opportunity>();
        List<Database.SaveResult> results = Database.update(changed, false, AccessLevel.SYSTEM_MODE);
        for (Integer i = 0; i < results.size(); i++) {
            if (results[i].isSuccess()) {
                saved.add(changed[i]);
            }
        }
        return saved;
    }

    private static Boolean applySessionIfReadable(Opportunity donation, String source) {
        try {
            return applySession(donation, gateway.getCheckoutSession(donation.Stripe_Session_Id__c), source);
        } catch (PaymentGateway.GatewayException e) {
            // Stays Pending; the next run asks again.
            return false;
        }
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
    private static Boolean applySession(Opportunity donation, PaymentGateway.CheckoutSession session, String source) {
        if (session.paid) {
            donation.StageName = 'Paid';
            donation.Amount = session.amount;
            donation.CloseDate = Date.today();
            donation.Stripe_Payment_Intent_Id__c = session.paymentId;
            donation.Confirmation_Source__c = source;
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
        request.successUrl = siteUrl(System.Label.Stripe_Success_Url);
        request.cancelUrl = siteUrl(System.Label.Stripe_Cancel_Url);
        request.metadata = new Map<String, String>{
            'donation_reference' => donation.Donation_Reference__c,
            'campaign_id' => String.valueOf(donation.CampaignId),
            'anonymous' => String.valueOf(donation.Is_Anonymous__c),
            'invoice' => String.valueOf(donation.Invoice_Requested__c)
        };
        return request;
    }

    // The labels hold the page's path in the site ("/s/gracias"), so the address follows the org's own
    // Experience Cloud domain and a deploy never points Stripe at a placeholder. A full https URL is used as is.
    private static String siteUrl(String page) {
        return page.startsWith('https://') ? page : 'https://' + DomainCreator.getExperienceCloudSitesHostname() + page;
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
        @AuraEnabled public Id campaignId { get; set; }
        @AuraEnabled public Decimal amount { get; set; }
        @AuraEnabled public Boolean anonymous { get; set; }
        @AuraEnabled public Boolean invoice { get; set; }
        @AuraEnabled public String email { get; set; }
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String company { get; set; }
        @AuraEnabled public String publicName { get; set; }
        @AuraEnabled public String personType { get; set; }
        @AuraEnabled public String rfc { get; set; }
        @AuraEnabled public Boolean invoiceConsent { get; set; }
    }
}
