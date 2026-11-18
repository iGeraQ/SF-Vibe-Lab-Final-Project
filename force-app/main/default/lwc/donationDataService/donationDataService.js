/**
 * The only place the public site gets or sends data. Every component calls these functions; none
 * imports Apex directly, so the components and their tests do not depend on the data source.
 *
 * Each function returns its imperative Apex call. The calls are imperative, not @wire, because the
 * controller methods are not cacheable: progress and recognition must be current right after a payment
 * (US-01 AC2). Errors arrive as the AuraHandledException's { body: { message } }, which the components show.
 */
import apexGetActiveCampaigns from '@salesforce/apex/PublicCampaignController.getActiveCampaigns';
import apexGetPastCampaigns from '@salesforce/apex/PublicCampaignController.getPastCampaigns';
import apexGetRecognition from '@salesforce/apex/PublicCampaignController.getRecognition';
import apexStartCheckout from '@salesforce/apex/DonationCheckoutService.startCheckout';
import apexConfirmCheckout from '@salesforce/apex/DonationCheckoutService.confirmCheckout';

/**
 * Campaigns that accept donations today (PublicCampaignController.getActiveCampaigns).
 * @returns {Promise<Object[]>} the campaigns
 */
export function getActiveCampaigns() {
    return apexGetActiveCampaigns();
}

/**
 * Campaigns whose end date has passed (PublicCampaignController.getPastCampaigns).
 * @returns {Promise<Object[]>} the campaigns
 */
export function getPastCampaigns() {
    return apexGetPastCampaigns();
}

/**
 * Paid credited donors and the anonymous total of a campaign (PublicCampaignController.getRecognition).
 * @param {string} campaignId the campaign
 * @returns {Promise<{donors: Object[], anonymousTotal: number}>} the recognition
 */
export function getRecognition(campaignId) {
    return apexGetRecognition({ campaignId });
}

/**
 * Creates the pending donation and the Stripe Checkout Session; returns where to send the donor
 * (DonationCheckoutService.startCheckout).
 * @param {Object} request a DonationCheckoutService.DonationRequest
 * @returns {Promise<string>} the Stripe Checkout address to open
 */
export function startCheckout(request) {
    return apexStartCheckout({ request });
}

/**
 * Applies the gateway's status to the donation when the donor returns to the thank-you page
 * (DonationCheckoutService.confirmCheckout).
 * @param {string} sessionId Stripe's session id from the address
 * @returns {Promise<string>} the donation status: Pending, Paid or Expired
 */
export function confirmCheckout(sessionId) {
    return apexConfirmCheckout({ sessionId });
}
