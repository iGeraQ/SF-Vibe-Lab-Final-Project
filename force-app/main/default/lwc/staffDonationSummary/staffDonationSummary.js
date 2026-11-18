import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, getFieldDisplayValue } from 'lightning/uiRecordApi';
import { NavigationMixin } from 'lightning/navigation';
import NAME_FIELD from '@salesforce/schema/Opportunity.Name';
import REFERENCE_FIELD from '@salesforce/schema/Opportunity.Donation_Reference__c';
import STAGE_FIELD from '@salesforce/schema/Opportunity.StageName';
import AMOUNT_FIELD from '@salesforce/schema/Opportunity.Amount';
import TYPE_FIELD from '@salesforce/schema/Opportunity.Donation_Type__c';
import CAMPAIGN_ID_FIELD from '@salesforce/schema/Opportunity.CampaignId';
import CAMPAIGN_NAME_FIELD from '@salesforce/schema/Opportunity.Campaign.Name';
import ANONYMOUS_FIELD from '@salesforce/schema/Opportunity.Is_Anonymous__c';
import INVOICE_FIELD from '@salesforce/schema/Opportunity.Invoice_Requested__c';
import SOURCE_FIELD from '@salesforce/schema/Opportunity.Confirmation_Source__c';
import CREATED_FIELD from '@salesforce/schema/Opportunity.CreatedDate';
import LABELS, { format } from 'c/staffLabels';
import { formatDateTime, formatMoney, stageInfo } from 'c/staffUtils';

const FIELDS = [
    NAME_FIELD,
    REFERENCE_FIELD,
    STAGE_FIELD,
    AMOUNT_FIELD,
    TYPE_FIELD,
    CAMPAIGN_ID_FIELD,
    CAMPAIGN_NAME_FIELD,
    ANONYMOUS_FIELD,
    INVOICE_FIELD,
    SOURCE_FIELD,
    CREATED_FIELD
];

/**
 * Summary and payment of a donation on its record page: campaign, type, amount and status
 * (US-09 AC1), the "Anónima", "Solicita factura" and pending flags (US-07 AC1, AC4) and the gateway
 * reference (US-09 AC5). Amount and status are shown locked: only the payment integration changes
 * them (US-09 AC3, Payment_Fields_Locked).
 */
export default class StaffDonationSummary extends NavigationMixin(LightningElement) {
    @api recordId;

    labels = LABELS;

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

    get stage() {
        return this.value(STAGE_FIELD);
    }

    get stageLabel() {
        return stageInfo(this.stage).label;
    }

    get stagePill() {
        return stageInfo(this.stage).pill;
    }

    get isPending() {
        return this.stage === 'Pending';
    }

    get isAnonymous() {
        return this.value(ANONYMOUS_FIELD) === true;
    }

    get invoiceRequested() {
        return this.value(INVOICE_FIELD) === true;
    }

    get hasBadges() {
        return this.isPending || this.isAnonymous || this.invoiceRequested;
    }

    get amountLabel() {
        return formatMoney(this.value(AMOUNT_FIELD));
    }

    get typeLabel() {
        return this.value(TYPE_FIELD) ?? LABELS.noValue;
    }

    get campaignId() {
        return this.value(CAMPAIGN_ID_FIELD);
    }

    get campaignName() {
        return this.value(CAMPAIGN_NAME_FIELD) ?? LABELS.noValue;
    }

    get reference() {
        return this.value(REFERENCE_FIELD) ?? this.value(NAME_FIELD);
    }

    get dateLabel() {
        return formatDateTime(this.value(CREATED_FIELD));
    }

    /** How the payment was confirmed, in words (US-09 AC5, RF-S4 for Delivery 2). */
    get confirmationLabel() {
        if (this.stage === 'Paid') {
            const source = getFieldDisplayValue(this.record.data, SOURCE_FIELD) ?? this.value(SOURCE_FIELD);
            return source ? format(LABELS.confirmedBy, source) : stageInfo('Paid').label;
        }
        if (this.stage === 'Expired') {
            return LABELS.expiredNote;
        }
        return LABELS.notConfirmed;
    }

    handleCampaign() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: { recordId: this.campaignId, objectApiName: 'Campaign', actionName: 'view' }
        });
    }
}
