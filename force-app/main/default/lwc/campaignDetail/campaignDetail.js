import { LightningElement } from 'lwc';
import { getActiveCampaigns } from 'c/donationDataService';
import { LABELS, format } from 'c/donationLabels';
import { getParam, pageUrl, toCampaignView } from 'c/donationUtils';

/**
 * Campaign page, at "campana?id=<campaign id>" (US-01 AC5, US-05).
 * Only active campaigns have a page: a past or unknown id shows "not available" (US-01 AC6).
 */
export default class CampaignDetail extends LightningElement {
    labels = LABELS;
    homeUrl = pageUrl('home');
    campaignId = getParam('id');
    campaigns;
    error;
    // The image did not load (wrong address or blocked host): show the placeholder instead of a broken image.
    imageFailed = false;

    connectedCallback() {
        getActiveCampaigns()
            .then((data) => {
                this.campaigns = data;
            })
            .catch((error) => {
                this.error = error;
            });
    }

    get campaign() {
        const match = (this.campaigns || []).find((item) => item.id === this.campaignId);
        return match ? toCampaignView(match) : null;
    }

    get showImage() {
        return this.campaign.hasImage && !this.imageFailed;
    }

    handleImageError() {
        this.imageFailed = true;
    }

    get isLoading() {
        return !this.campaigns && !this.error;
    }

    get hasError() {
        return Boolean(this.error);
    }

    get notFound() {
        return !this.campaign;
    }

    get raisedOfGoal() {
        return format(LABELS.raisedOfGoal, this.campaign.goalLabel);
    }

    get percentOfGoal() {
        return format(LABELS.percentOfGoal, this.campaign.percentLabel);
    }
}
