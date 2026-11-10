import { LightningElement, api } from 'lwc';
import { getRecognition } from 'c/donationDataService';
import { LABELS } from 'c/donationLabels';
import { formatMoney } from 'c/donationUtils';

// About this many rows fit in the list's height; with more, the list scrolls by itself (US-05 AC4).
const VISIBLE_ROWS = 5;

/**
 * Donor recognition of one campaign (US-05): display name and amount of paid, non-anonymous donations,
 * plus one "Donantes anónimos" row with the total of paid anonymous donations (US-05 AC8, US-02 AC7).
 * Names come from the controller as plain text and are rendered as text, never as HTML (US-12 AC7).
 */
export default class DonorRecognition extends LightningElement {
    @api campaignId;
    @api donateUrl;

    labels = LABELS;
    recognition;
    error;

    connectedCallback() {
        getRecognition(this.campaignId)
            .then((data) => {
                this.recognition = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    get donors() {
        const donors = (this.recognition && this.recognition.donors) || [];
        return donors.map((donor, index) => ({
            key: `donor-${index}`,
            name: donor.name,
            amountLabel: formatMoney(donor.amount)
        }));
    }

    get anonymousTotal() {
        return Number(this.recognition && this.recognition.anonymousTotal) || 0;
    }

    get isLoading() {
        return !this.recognition && !this.error;
    }

    get hasError() {
        return Boolean(this.error);
    }

    get hasDonors() {
        return this.donors.length > 0;
    }

    get hasAnonymous() {
        return this.anonymousTotal > 0;
    }

    get isEmpty() {
        return !this.hasDonors && !this.hasAnonymous;
    }

    get anonymousLabel() {
        return formatMoney(this.anonymousTotal);
    }

    get isScrolling() {
        return this.donors.length > VISIBLE_ROWS;
    }

    get listClass() {
        return this.isScrolling ? 'ticker ticker-on' : 'ticker';
    }

    get animationDuration() {
        // About three seconds per donor, never faster than 14 s for the whole list.
        return this.isScrolling ? `${Math.max(14, this.donors.length * 3)}s` : '';
    }

    renderedCallback() {
        // Set from JavaScript instead of a style={...} binding in the template, which editors flag as invalid CSS.
        const track = this.template.querySelector('.ticker-track');
        if (track) {
            track.style.animationDuration = this.animationDuration;
        }
    }
}
