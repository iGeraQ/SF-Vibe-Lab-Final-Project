/**
 * Starts and confirms a donation's Stripe test payment (US-03, US-04), called by the site's guest user from the LWC.
 * Stripe is the only source of the payment status and amount. The guest has no access to Opportunity, so the class
 * runs without sharing and in system mode, and it only touches the donation it creates or the one tied to a session.
 */
public without sharing class DonationCheckoutService {

    private static final Integer SESSION_MINUTES = 60;
    private static final Decimal MINIMUM_AMOUNT = 10;
    private static final String STRIPE_DOWN = 'No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.';

    /**
     * @description Creates the Stripe Checkout Session and saves the donation as Pending (US-03 AC1, AC2).
     * @param request the donation form
     * @return the Stripe Checkout URL to send the donor to
     */
    @AuraEnabled
    public static String startCheckout(DonationRequest request) {
        String campaignName = request == null ? null : openCampaignName(request.campaignId);
        if (campaignName == null) {
            throw error('Esta campaña ya no recibe donaciones.');
        }
        if (request.amount == null || request.amount < MINIMUM_AMOUNT) {
            throw error('El monto mínimo es de $10 MXN.');
        }
        Opportunity donation = newDonation(request, campaignName);
        // Stripe goes first: Salesforce allows no callout after DML in the same transaction.
        Map<String, Object> session = callStripe('/v1/checkout/sessions', checkoutForm(donation, campaignName));
        donation.Stripe_Session_Id__c = (String) session.get('id');
        try {
            insert as system donation;
        } catch (DmlException e) {
            // The unused Stripe session expires on its own.
            throw error(e.getDmlMessage(0));
        }
        return (String) session.get('url');
    }

    /**
     * @description Applies Stripe's status to the donation when the donor returns to the thank-you page (US-04).
     * @param sessionId the Checkout Session ID from the thank-you page URL
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

        Map<String, Object> session = callStripe('/v1/checkout/sessions/' + EncodingUtil.urlEncode(sessionId, 'UTF-8'), null);
        if ('paid'.equals(session.get('payment_status'))) {
            donation.StageName = 'Paid';
            donation.Amount = Decimal.valueOf(String.valueOf(session.get('amount_total'))) / 100;
            donation.CloseDate = Date.today();
            donation.Stripe_Payment_Intent_Id__c = (String) session.get('payment_intent');
            donation.Confirmation_Source__c = 'Return_Page';
        } else if ('expired'.equals(session.get('status'))) {
            donation.StageName = 'Expired';
        } else {
            return donation.StageName;
        }
        try {
            update as system donation;
        } catch (DmlException e) {
            throw error('No pudimos registrar el estado de tu pago. Lo revisaremos y te escribiremos.');
        }
        return donation.StageName;
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

    private static Map<String, String> checkoutForm(Opportunity donation, String campaignName) {
        return new Map<String, String>{
            'mode' => 'payment',
            'locale' => 'es-419',
            'client_reference_id' => donation.Donation_Reference__c,
            'line_items[0][quantity]' => '1',
            'line_items[0][price_data][currency]' => 'mxn',
            'line_items[0][price_data][unit_amount]' => String.valueOf((donation.Amount * 100).setScale(0)),
            'line_items[0][price_data][product_data][name]' => 'Donación · ' + campaignName,
            'metadata[donation_reference]' => donation.Donation_Reference__c,
            'metadata[campaign_id]' => String.valueOf(donation.CampaignId),
            'metadata[anonymous]' => String.valueOf(donation.Is_Anonymous__c),
            'metadata[invoice]' => String.valueOf(donation.Invoice_Requested__c),
            'expires_at' => String.valueOf(donation.Stripe_Session_Expires_At__c.getTime() / 1000),
            'success_url' => System.Label.Stripe_Success_Url + '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => System.Label.Stripe_Cancel_Url
        };
    }

    private static String openCampaignName(Id campaignId) {
        for (PublicCampaignController.CampaignView campaign : PublicCampaignController.getActiveCampaigns()) {
            if (campaign.id == campaignId) {
                return campaign.name;
            }
        }
        return null;
    }

    // A form means POST; its client_reference_id doubles as the Idempotency-Key, so a retried submit makes one session.
    private static Map<String, Object> callStripe(String path, Map<String, String> form) {
        HttpRequest request = new HttpRequest();
        request.setEndpoint('callout:Stripe' + path);
        request.setMethod(form == null ? 'GET' : 'POST');
        if (form != null) {
            List<String> pairs = new List<String>();
            for (String key : form.keySet()) {
                pairs.add(key + '=' + EncodingUtil.urlEncode(form.get(key), 'UTF-8'));
            }
            request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setBody(String.join(pairs, '&'));
            request.setHeader('Idempotency-Key', form.get('client_reference_id'));
        }
        HttpResponse response;
        try {
            response = new Http().send(request);
        } catch (CalloutException e) {
            throw error(STRIPE_DOWN);
        }
        if (response.getStatusCode() != 200) {
            throw error(STRIPE_DOWN);
        }
        return (Map<String, Object>) JSON.deserializeUntyped(response.getBody());
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
