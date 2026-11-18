import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NAME_FIELD from '@salesforce/schema/Campaign.Name';
import ACTIVE_FIELD from '@salesforce/schema/Campaign.IsActive';
import START_FIELD from '@salesforce/schema/Campaign.StartDate';
import END_FIELD from '@salesforce/schema/Campaign.EndDate';
import GOAL_FIELD from '@salesforce/schema/Campaign.ExpectedRevenue';
import RAISED_FIELD from '@salesforce/schema/Campaign.AmountWonOpportunities';
import LABELS, { format } from 'c/staffLabels';
import { SITUATIONS, campaignSituation, formatDate, formatMoney, percentOf, todayIso } from 'c/staffUtils';

const FIELDS = [NAME_FIELD, ACTIVE_FIELD, START_FIELD, END_FIELD, GOAL_FIELD, RAISED_FIELD];

/**
 * Situation and progress of a campaign on its record page (US-08): whether it takes donations today,
 * and the raised amount and percentage of its goal, which keep counting past 100% (US-08 AC5).
 * Read only: the progress comes from paid donations.
 */
export default class StaffCampaignProgress extends LightningElement {
    @api recordId;

    labels = LABELS;
    today = todayIso();

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    record;

    value(field) {
        return getFieldValue(this.record.data, field);
    }

    get isLoading() {
        return !this.record || (!this.record.data && !this.record.error);
    }

    get hasError() {
        return Boolean(this.record?.error);
    }

    get situation() {
        return campaignSituation(
            {
                isActive: this.value(ACTIVE_FIELD),
                startDate: this.value(START_FIELD),
                endDate: this.value(END_FIELD)
            },
            this.today
        );
    }

    get situationLabel() {
        return SITUATIONS[this.situation].label;
    }

    get pillClass() {
        return SITUATIONS[this.situation].pill;
    }

    get scheduleLabel() {
        return `${formatDate(this.value(START_FIELD))} – ${formatDate(this.value(END_FIELD))}`;
    }

    get raisedLabel() {
        return formatMoney(this.value(RAISED_FIELD) ?? 0);
    }

    get goalLabel() {
        return formatMoney(this.value(GOAL_FIELD));
    }

    get percent() {
        return percentOf(this.value(RAISED_FIELD), this.value(GOAL_FIELD));
    }

    get percentLabel() {
        return `${this.percent}%`;
    }

    get muted() {
        return this.situation === 'finished' || this.situation === 'inactive';
    }

    get progressLabel() {
        return format(LABELS.progressOf, this.value(NAME_FIELD));
    }
}
