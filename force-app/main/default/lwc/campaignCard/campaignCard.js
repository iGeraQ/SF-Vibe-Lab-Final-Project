import { LightningElement, api } from 'lwc';
import { LABELS } from 'c/donationLabels';

/**
 * One campaign in the active or past list. Past campaigns have no donate button (US-01 AC6).
 */
export default class CampaignCard extends LightningElement {
    /** A campaign already passed through toCampaignView. */
    @api campaign;
    /** Whether the campaign has ended. */
    @api past = false;

    labels = LABELS;

    get showActions() {
        return !this.past;
    }

    get imageClass() {
        return this.past ? 'image image-past image-placeholder' : 'image image-placeholder';
    }

    get percentClass() {
        return this.past ? 'percent percent-past' : 'percent';
    }

    get raisedCaption() {
        return this.past ? LABELS.finalAmount : LABELS.raised;
    }

    get viewLabel() {
        return `${LABELS.viewCampaign}: ${this.campaign.name}`;
    }
}
