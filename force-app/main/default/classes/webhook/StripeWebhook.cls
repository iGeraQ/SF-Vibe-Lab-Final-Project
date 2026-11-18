/**
 * Receives Stripe's payment notices through the site (US-14, US-16, US-17, #51). A notice is accepted only with a
 * valid Stripe-Signature (HMAC-SHA256 of the raw body with the signing secret stored in Setup, plus a 5 minute
 * window). Every notice leaves a Payment_Notice__c for staff (US-15). A repeated event id is ignored, so a retried
 * notice never pays or emails twice. The status and amount always come from the signed body, never from the URL.
 * The guest user calls it, so it runs without sharing and in system mode.
 */
@RestResource(urlMapping='/stripe/webhook')
global without sharing class StripeWebhook {

    private static final Integer TOLERANCE_SECONDS = 300;
    private static final Set<String> HANDLED_EVENTS = new Set<String>{ 'checkout.session.completed', 'checkout.session.expired' };

    /**
     * @description Stripe's POST. 400 for an unsigned or badly signed notice, 200 for everything else (Stripe
     * retries any other code, and retrying a notice for an unknown donation can never succeed).
     */
    @HttpPost
    global static void receive() {
        RestRequest request = RestContext.request;
        String body = request.requestBody == null ? '' : request.requestBody.toString();
        String signatureError = signatureError(body, request.headers.get('Stripe-Signature'), Datetime.now());
        if (signatureError != null) {
            reject(null, null, signatureError);
            respond(400, signatureError);
            return;
        }
        try {
            respond(200, handle((Map<String, Object>) JSON.deserializeUntyped(body)));
        } catch (JSONException e) {
            unreadable();
        } catch (NullPointerException e) {
            unreadable();
        } catch (TypeException e) {
            // A DmlException is not caught on purpose: Stripe gets a 500 and retries.
            unreadable();
        }
    }

    // Applies one verified event and returns what happened, for the response body.
    private static String handle(Map<String, Object> event) {
        String eventId = (String) event.get('id');
        String type = (String) event.get('type');
        // The endpoint may receive more event types than we use (payment_intent.*, invoice.*): they are not notices
        // about a donation, so they are answered 200 and left out of the staff list (US-15).
        if (!HANDLED_EVENTS.contains(type)) {
            return 'ignored';
        }
        if (![SELECT Id FROM Payment_Notice__c WHERE Stripe_Event_Id__c = :eventId WITH SYSTEM_MODE LIMIT 1].isEmpty()) {
            return 'duplicate';
        }
        Map<String, Object> session = (Map<String, Object>) ((Map<String, Object>) event.get('data')).get('object');
        String reference = (String) session.get('client_reference_id');
        String sessionId = (String) session.get('id');
        List<Opportunity> donations = [
            SELECT Id, StageName
            FROM Opportunity
            WHERE Donation_Reference__c = :reference AND Stripe_Session_Id__c = :sessionId
            WITH SYSTEM_MODE
            LIMIT 1
        ];
        if (donations.isEmpty()) {
            reject(eventId, type, 'No existe una donación para este aviso.');
            return 'rejected';
        }
        Opportunity donation = donations[0];
        if (donation.StageName == 'Pending') {
            if ('checkout.session.completed'.equals(type) && 'paid'.equals(session.get('payment_status'))) {
                donation.StageName = 'Paid';
                donation.Amount = Decimal.valueOf(String.valueOf(session.get('amount_total'))) / 100; // cents; a missing amount fails the update and Stripe retries
                donation.CloseDate = Date.today();
                donation.Stripe_Payment_Intent_Id__c = (String) session.get('payment_intent');
                donation.Confirmation_Source__c = 'Webhook';
                update as system donation;
            } else if ('checkout.session.expired'.equals(type)) {
                donation.StageName = 'Expired';
                update as system donation;
            }
        }
        save(new Payment_Notice__c(Stripe_Event_Id__c = eventId, Event_Type__c = type, Donation__c = donation.Id, Result__c = 'Accepted'));
        return 'accepted';
    }

    // Checks the Stripe-Signature header (t=<unix>,v1=<hex>); returns the reason it fails, or null when valid.
    @TestVisible
    private static String signatureError(String body, String header, Datetime now) {
        String secret = Stripe_Webhook_Config__c.getOrgDefaults().Signing_Secret__c;
        if (String.isBlank(secret)) {
            return 'El secreto de firma no está configurado.';
        }
        if (String.isBlank(header)) {
            return 'Falta la firma de Stripe.';
        }
        Map<String, Set<String>> parts = parseHeader(header);
        Set<String> times = parts.get('t');
        // A timestamp that is not a plain number of at most 12 digits can't be a real one.
        if (times.size() != 1 || !new List<String>(times)[0].isNumeric() || new List<String>(times)[0].length() > 12) {
            return 'La firma de Stripe no se puede leer.';
        }
        String timestamp = new List<String>(times)[0];
        if (Math.abs(now.getTime() / 1000 - Long.valueOf(timestamp)) > TOLERANCE_SECONDS) {
            return 'La firma de Stripe está fuera de tiempo.';
        }
        String expected = sign(timestamp, body, secret);
        // ponytail: plain Set lookup, not constant-time; Apex has no constant-time compare.
        return parts.get('v1').contains(expected) ? null : 'La firma de Stripe no es válida.';
    }

    // Splits "t=...,v1=...,v1=..." into its timestamp and signature values.
    private static Map<String, Set<String>> parseHeader(String header) {
        Map<String, Set<String>> parts = new Map<String, Set<String>>{ 't' => new Set<String>(), 'v1' => new Set<String>() };
        for (String part : header.split(',')) {
            List<String> pair = part.trim().split('=', 2);
            if (pair.size() == 2 && parts.containsKey(pair[0])) {
                parts.get(pair[0]).add(pair[1]);
            }
        }
        return parts;
    }

    @TestVisible
    private static String sign(String timestamp, String body, String secret) {
        return EncodingUtil.convertToHex(
            Crypto.generateMac('HmacSHA256', Blob.valueOf(timestamp + '.' + body), Blob.valueOf(secret))
        );
    }

    private static void unreadable() {
        reject(null, null, 'El aviso de Stripe no se puede leer.');
        respond(400, 'unreadable');
    }

    private static void reject(String eventId, String type, String reason) {
        save(new Payment_Notice__c(
            Stripe_Event_Id__c = eventId, Event_Type__c = type, Result__c = 'Rejected', Rejection_Reason__c = reason
        ));
    }

    private static void save(Payment_Notice__c notice) {
        notice.Received_At__c = Datetime.now();
        insert as system notice;
    }

    private static void respond(Integer status, String message) {
        RestContext.response.statusCode = status;
        RestContext.response.responseBody = Blob.valueOf(message);
    }
}
