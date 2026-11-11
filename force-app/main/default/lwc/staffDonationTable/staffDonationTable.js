import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import LABELS from 'c/staffLabels';

/**
 * Donation table of the staff app (US-09 AC1, US-07 AC1). Each row opens the donation record.
 * variant: "all" (with the campaign), "campaign" (inside a campaign, no campaign column) or
 * "invoice" (name or company, RFC, person type and consent for invoice requests).
 */
export default class StaffDonationTable extends NavigationMixin(LightningElement) {
    @api rows = [];
    @api variant = 'all';
    @api emptyLabel;
    /** Inside a card: no outer border. */
    @api flush = false;

    labels = LABELS;

    get wrapClass() {
        return this.flush ? 'table-wrap table-flush' : 'table-wrap';
    }

    get hasRows() {
        return Array.isArray(this.rows) && this.rows.length > 0;
    }

    get isInvoice() {
        return this.variant === 'invoice';
    }

    get showCampaign() {
        return this.variant !== 'campaign';
    }

    get emptyText() {
        return this.emptyLabel || LABELS.donationsEmpty;
    }

    handleOpen(event) {
        event.stopPropagation();
        const recordId = event.currentTarget.dataset.id;
        if (!recordId) {
            return;
        }
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId, objectApiName: 'Opportunity', actionName: 'view' }
        });
    }
}
