import { LightningElement, api } from 'lwc';
import { getActiveCampaigns, getPastCampaigns } from 'c/donationDataService';
import { LABELS } from 'c/donationLabels';
import { toCampaignView } from 'c/donationUtils';

// Experience Builder shows the page in a preview host; redirecting there would leave the builder.
function isBuilderPreview() {
    try {
        return /preview|builder/i.test(window.location.hostname);
    } catch {
        return false;
    }
}

/**
 * Home page (mode "active") and past campaigns page (mode "past") (US-01 AC1, AC4, AC6).
 * With only one active campaign, the home page opens it directly.
 */
export default class CampaignList extends LightningElement {
    /** "active" or "past", set in Experience Builder. */
    @api mode = 'active';

    labels = LABELS;
    source;
    error;

    get isPast() {
        return this.mode === 'past';
    }

    connectedCallback() {
        const load = this.isPast ? getPastCampaigns() : getActiveCampaigns();
        load.then((data) => this.handleData(data)).catch((error) => {
            this.error = error;
        });
    }

    handleData(data) {
        if (!this.isPast && data.length === 1 && !isBuilderPreview()) {
            // US-01 AC4: with one active campaign, land on its page.
            window.location.replace(toCampaignView(data[0]).pageUrl);
            return;
        }
        this.source = data;
    }

    get campaigns() {
        return (this.source || []).map((campaign) => toCampaignView(campaign, this.isPast));
    }

    get isLoading() {
        return !this.source && !this.error;
    }

    get hasError() {
        return Boolean(this.error);
    }

    get isEmpty() {
        // The active list is never empty: the general campaign is always open (US-08 AC8).
        return this.campaigns.length === 0;
    }

    get title() {
        return this.isPast ? LABELS.pastTitle : LABELS.activeTitle;
    }

    get intro() {
        return this.isPast ? LABELS.pastIntro : LABELS.activeIntro;
    }

    get gridClass() {
        return this.isPast ? 'grid grid-past' : 'grid';
    }
}
