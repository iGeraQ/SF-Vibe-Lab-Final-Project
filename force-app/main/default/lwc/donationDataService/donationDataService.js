/**
 * The only place the public site gets or sends data. Every component calls these functions; none
 * imports Apex directly. For now they answer with fictitious data (c/donationMockData), so the site
 * works end to end without the backend. To connect the backend, replace each function body with its
 * Apex call; docs/public-site.md shows the exact code. The components do not change.
 *
 * Every function returns a Promise, as an imperative Apex call does. Errors are rejected with the shape
 * of an AuraHandledException ({ body: { message } }), so the components already handle real errors.
 */
import { MOCK_ACTIVE_CAMPAIGNS, MOCK_PAST_CAMPAIGNS, MOCK_RECOGNITION } from 'c/donationMockData';
import { pageUrl } from 'c/donationUtils';

// Mock-only test inputs, so the video can show each path without Stripe: an email that starts with
// "cancelar@" lands on the payment-not-completed page, and one that starts with "error@" fails like the
// gateway being down.
const MOCK_CANCEL_EMAIL = /^cancelar@/i;
const MOCK_ERROR_EMAIL = /^error@/i;
const MOCK_SESSION_PREFIX = 'cs_mock_';
// Same minimum as DonationCheckoutService.
const MINIMUM_AMOUNT = 10;

function copy(value) {
    return JSON.parse(JSON.stringify(value));
}

function serverError(message) {
    return Promise.reject({ body: { message } });
}

/**
 * Campaigns that accept donations today (PublicCampaignController.getActiveCampaigns).
 * @returns {Promise<Object[]>} the campaigns
 */
export function getActiveCampaigns() {
    return Promise.resolve(copy(MOCK_ACTIVE_CAMPAIGNS));
}

/**
 * Campaigns whose end date has passed (PublicCampaignController.getPastCampaigns).
 * @returns {Promise<Object[]>} the campaigns
 */
export function getPastCampaigns() {
    return Promise.resolve(copy(MOCK_PAST_CAMPAIGNS));
}

/**
 * Paid credited donors and the anonymous total of a campaign (PublicCampaignController.getRecognition).
 * @param {string} campaignId the campaign
 * @returns {Promise<{donors: Object[], anonymousTotal: number}>} the recognition
 */
export function getRecognition(campaignId) {
    return Promise.resolve(copy(MOCK_RECOGNITION[campaignId] || { donors: [], anonymousTotal: 0 }));
}

/**
 * Creates the pending donation and the Stripe Checkout Session; returns where to send the donor
 * (DonationCheckoutService.startCheckout). The mock checks what the service checks, with its messages, and
 * instead of Stripe goes straight to the thank-you page.
 * @param {Object} request a DonationCheckoutService.DonationRequest
 * @returns {Promise<string>} the address to open
 */
export function startCheckout(request) {
    const campaign = MOCK_ACTIVE_CAMPAIGNS.find((item) => item.id === request.campaignId);
    if (!campaign) {
        return serverError('Esta campaña ya no recibe donaciones.');
    }
    if (!(request.amount >= MINIMUM_AMOUNT)) {
        return serverError('El monto mínimo es de $10 MXN.');
    }
    if (MOCK_ERROR_EMAIL.test(request.email || '')) {
        return serverError('No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.');
    }
    if (MOCK_CANCEL_EMAIL.test(request.email || '')) {
        // Like Stripe's cancel_url (the Stripe_Cancel_Url label), it carries no campaign.
        return Promise.resolve(pageUrl('cancelled'));
    }
    return Promise.resolve(pageUrl('thanks', { session_id: `${MOCK_SESSION_PREFIX}${campaign.id}` }));
}

/**
 * Applies the gateway's status to the donation when the donor returns to the thank-you page
 * (DonationCheckoutService.confirmCheckout).
 * @param {string} sessionId Stripe's session id from the address
 * @returns {Promise<string>} the donation status: Pending, Paid or Expired
 */
export function confirmCheckout(sessionId) {
    const known = (sessionId || '').startsWith(MOCK_SESSION_PREFIX);
    return known ? Promise.resolve('Paid') : serverError('No encontramos tu donación.');
}
