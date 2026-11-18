import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import OPPORTUNITY_OBJECT from '@salesforce/schema/Opportunity';
import ID_FIELD from '@salesforce/schema/Opportunity.Id';
import EMAIL_FIELD from '@salesforce/schema/Opportunity.Donor_Email__c';
import PUBLIC_NAME_FIELD from '@salesforce/schema/Opportunity.Public_Name__c';
import ANONYMOUS_FIELD from '@salesforce/schema/Opportunity.Is_Anonymous__c';
import LABELS from 'c/staffLabels';
import { errorMessage } from 'c/staffUtils';

const FIELDS = [EMAIL_FIELD, PUBLIC_NAME_FIELD, ANONYMOUS_FIELD];

/**
 * Donor card on the donation record page: the donor's email, which every staff role sees (US-09 AC2),
 * and the public name. Only users whose field permissions allow it (the Moderator) get the input to
 * change the name (US-09 AC4); everyone else sees it read only. Validation rules still apply on save.
 */
export default class StaffDonorCard extends LightningElement {
    @api recordId;

    labels = LABELS;
    draft;
    saving = false;
    message;
    errorText;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    record;

    @wire(getObjectInfo, { objectApiName: OPPORTUNITY_OBJECT })
    objectInfo;

    value(field) {
        return getFieldValue(this.record.data, field);
    }

    get isLoading() {
        return !this.record || (!this.record.data && !this.record.error);
    }

    get hasError() {
        return Boolean(this.record?.error);
    }

    get email() {
        return this.value(EMAIL_FIELD) ?? LABELS.noValue;
    }

    get publicName() {
        return this.value(PUBLIC_NAME_FIELD) ?? '';
    }

    get publicNameText() {
        return this.publicName || LABELS.noValue;
    }

    get isAnonymous() {
        return this.value(ANONYMOUS_FIELD) === true;
    }

    /** The object and the field must both be editable for this user. */
    get canEdit() {
        const info = this.objectInfo?.data;
        return info?.updateable === true && info?.fields?.[PUBLIC_NAME_FIELD.fieldApiName]?.updateable === true;
    }

    get inputValue() {
        return this.draft ?? this.publicName;
    }

    get saveDisabled() {
        return this.saving || this.draft === undefined || this.draft.trim() === this.publicName;
    }

    get saveLabel() {
        return this.saving ? LABELS.saving : LABELS.save;
    }

    handleInput(event) {
        this.draft = event.target.value;
        this.message = undefined;
        this.errorText = undefined;
    }

    async handleSave() {
        if (this.saveDisabled) {
            return;
        }
        this.saving = true;
        this.message = undefined;
        this.errorText = undefined;
        try {
            await updateRecord({
                fields: {
                    [ID_FIELD.fieldApiName]: this.recordId,
                    [PUBLIC_NAME_FIELD.fieldApiName]: this.draft.trim()
                }
            });
            this.draft = undefined;
            this.message = LABELS.saved;
        } catch (error) {
            this.errorText = errorMessage(error, LABELS.saveError);
        } finally {
            this.saving = false;
        }
    }
}
