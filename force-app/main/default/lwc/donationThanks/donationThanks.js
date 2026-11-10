import { LightningElement } from 'lwc';
import { confirmCheckout } from 'c/donationDataService';
import { LABELS } from 'c/donationLabels';
import { getParam, pageUrl } from 'c/donationUtils';

/**
 * Thank-you page, Stripe's success_url: "gracias?session_id={CHECKOUT_SESSION_ID}" (US-04).
 *
 * It calls confirmCheckout (c/donationDataService; DonationCheckoutService.confirmCheckout once connected),
 * which applies Stripe's status to the donation (Delivery 1 marks it Paid this way). The page does not show
 * that status: it never says the payment is confirmed and never shows the email or any other donor data
 * (US-04 AC2, AC3, AC6). If the check fails, the page still thanks the donor: the scheduled check completes
 * the donation later (US-03 AC5).
 */
export default class DonationThanks extends LightningElement {
    labels = LABELS;
    homeUrl = pageUrl('home');

    connectedCallback() {
        const sessionId = getParam('session_id');
        if (!sessionId) {
            return;
        }
        confirmCheckout(sessionId).catch(() => {
            // Nothing to show: the thank-you text does not depend on the check.
        });
    }
}
