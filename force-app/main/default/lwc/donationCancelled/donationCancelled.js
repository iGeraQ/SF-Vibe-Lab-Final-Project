import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';
import { getParam, pageUrl } from 'c/donationUtils';

/**
 * Payment not completed, Stripe's cancel_url: "pago-no-completado?campana=<campaign id>" (US-04 AC5).
 * "Intentar de nuevo" opens the form of the same campaign, or the home page without a campaign.
 */
export default class DonationCancelled extends LightningElement {
    labels = LABELS;

    get retryUrl() {
        const campaignId = getParam('campana');
        return campaignId ? pageUrl('donate', { campana: campaignId }) : pageUrl('home');
    }
}
