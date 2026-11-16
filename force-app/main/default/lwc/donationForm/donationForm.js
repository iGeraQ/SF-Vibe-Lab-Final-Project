import { LightningElement } from 'lwc';
import { getActiveCampaigns, startCheckout } from 'c/donationDataService';
import { LABELS } from 'c/donationLabels';
import {
    SUGGESTED_AMOUNTS,
    HIGHLIGHT_AMOUNT,
    apexMessage,
    formatMoney,
    getParam,
    pageUrl,
    parseAmount,
    toCampaignView,
    validateAmount,
    validateEmail,
    validateRfc
} from 'c/donationUtils';

const STEP_NAMES = [LABELS.stepAmount, LABELS.stepType, LABELS.stepData, LABELS.stepConfirm];
const MAX_LENGTH = { email: 80, publicName: 120, firstName: 80, lastName: 80, company: 255 };

/**
 * Donation form at "donar?campana=<campaign id>", in four steps: amount, type, data and confirmation
 * (US-01 AC3, AC7 to AC10; US-02; US-03; US-05 AC3; US-06).
 *
 * Step 2 asks two separate questions, as the client approved on Nov 9: whether to appear in the donor
 * list, and whether an invoice is needed. An anonymous donor can request an invoice (US-02 AC3).
 *
 * "Ir a pagar" calls startCheckout (c/donationDataService → DonationCheckoutService.startCheckout), which creates the pending donation and the Stripe Checkout Session and returns the
 * session's URL. The request uses the fields of DonationCheckoutService.DonationRequest. The browser never
 * sends a status, and the service checks the campaign and the amount again (docs/seguridad.md).
 */
export default class DonationForm extends LightningElement {
    labels = LABELS;
    campaignId = getParam('campana');
    campaigns;
    loadError;

    step = 1;
    amount = null;
    isAnonymous = null;
    invoiceRequested = null;
    email = '';
    publicName = '';
    personType = '';
    firstName = '';
    lastName = '';
    company = '';
    rfc = '';
    consent = false;
    attempted = false;
    processing = false;
    submitError = '';
    focusPending = false;
    // The image did not load (wrong address or blocked host): show the placeholder instead of a broken image.
    imageFailed = false;
    // US-13: "Otro monto" lets the donor type any amount from $10 MXN.
    customMode = false;
    customText = '';
    // The custom amount's error shows after the donor leaves the field or tries to continue, not while typing.
    customAttempted = false;
    focusCustomPending = false;

    connectedCallback() {
        getActiveCampaigns()
            .then((data) => {
                this.campaigns = data;
            })
            .catch((error) => {
                this.loadError = error;
            });
    }

    // ---------- Campaign ----------

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
        return !this.campaigns && !this.loadError;
    }

    get hasLoadError() {
        return Boolean(this.loadError);
    }

    get notAvailable() {
        // US-01 AC6: a finished or unknown campaign cannot receive donations.
        return !this.campaign;
    }

    get homeUrl() {
        return pageUrl('home');
    }

    get backUrl() {
        return this.campaign ? this.campaign.pageUrl : this.homeUrl;
    }

    // ---------- Steps ----------

    get isStep1() {
        return this.step === 1;
    }

    get isStep2() {
        return this.step === 2;
    }

    get isStep3() {
        return this.step === 3;
    }

    get isStep4() {
        return this.step === 4;
    }

    get steps() {
        return STEP_NAMES.map((label, index) => {
            const number = index + 1;
            const current = number === this.step;
            const done = number < this.step;
            return {
                key: `step-${number}`,
                text: `${number}. ${label}`,
                ariaCurrent: current ? 'step' : null,
                barClass: current || done ? 'step-bar step-bar-on' : 'step-bar',
                textClass: current ? 'step-text step-text-current' : 'step-text'
            };
        });
    }

    get showBack() {
        return this.step === 2 || this.step === 3;
    }

    get showNext() {
        return this.step < 4;
    }

    get nextDisabled() {
        // With "Otro monto" the button stays enabled, so pressing it shows why the typed amount isn't valid.
        return (this.step === 1 && !this.amount && !this.customMode) || (this.step === 2 && !this.typeChosen);
    }

    get nextHint() {
        if (this.step === 1 && !this.amount && !this.customMode) {
            return LABELS.amountHint;
        }
        if (this.step === 2 && !this.typeChosen) {
            return LABELS.typeHint;
        }
        return null;
    }

    handleNext() {
        if (this.nextDisabled) {
            return;
        }
        if (this.step === 1 && this.customMode && validateAmount(this.customText)) {
            // US-13 AC2, AC3, AC5: a typed amount that can't be donated stops here with its reason.
            this.customAttempted = true;
            this.focusCustomPending = true;
            return;
        }
        if (this.step === 3) {
            this.attempted = true;
            if (Object.keys(this.errors).length > 0) {
                this.focusFirstError();
                return;
            }
        }
        this.goToStep(this.step + 1);
    }

    handleBack() {
        this.goToStep(Math.max(1, this.step - 1));
    }

    handleChangeAmount() {
        // US-01 AC9: leave the confirmation without opening the gateway and change the amount.
        this.goToStep(1);
    }

    handleChangeData() {
        this.goToStep(3);
    }

    goToStep(step) {
        this.step = step;
        this.submitError = '';
        try {
            window.scrollTo(0, 0);
        } catch {
            // Scrolling is a convenience only.
        }
    }

    // ---------- Step 1: amount ----------

    get amountOptions() {
        return SUGGESTED_AMOUNTS.map((value) => {
            const selected = !this.customMode && this.amount === value;
            return {
                key: `amount-${value}`,
                value,
                label: formatMoney(value).replace(' MXN', ''),
                pressed: selected ? 'true' : 'false',
                className: selected ? 'amount amount-on' : 'amount'
            };
        });
    }

    handleAmount(event) {
        this.customMode = false;
        this.customAttempted = false;
        this.amount = Number(event.currentTarget.dataset.value);
    }

    // ---------- Step 1: custom amount (US-13) ----------

    get customPressed() {
        return this.customMode ? 'true' : 'false';
    }

    get customClass() {
        return this.customMode ? 'amount amount-other amount-on' : 'amount amount-other';
    }

    get customError() {
        return this.customAttempted ? validateAmount(this.customText) : null;
    }

    get customInvalid() {
        return this.customError ? 'true' : 'false';
    }

    get customInputClass() {
        return this.customError ? 'input custom-input input-error' : 'input custom-input';
    }

    handleCustomAmount() {
        this.customMode = true;
        this.setCustomAmount();
        this.focusCustomPending = true;
    }

    handleCustomInput(event) {
        this.customText = event.target.value;
        this.setCustomAmount();
    }

    handleCustomBlur() {
        if (this.customText.trim()) {
            this.customAttempted = true;
        }
    }

    // The amount only counts while the typed text can be donated; otherwise there is no amount yet.
    setCustomAmount() {
        this.amount = validateAmount(this.customText) ? null : parseAmount(this.customText);
    }

    get hasAmount() {
        return Boolean(this.amount);
    }

    get amountLabel() {
        return this.amount ? formatMoney(this.amount) : '—';
    }

    get isBigAmount() {
        // US-01 AC8: amounts of $1,000 MXN or more are highlighted in the confirmation.
        return this.amount >= HIGHLIGHT_AMOUNT;
    }

    // ---------- Step 2: list and invoice ----------

    get typeChosen() {
        return this.isAnonymous !== null && this.invoiceRequested !== null;
    }

    get listOptions() {
        return [
            this.option('list', 'credited', LABELS.listYes, LABELS.listYesLine, this.isAnonymous === false),
            this.option('list', 'anonymous', LABELS.listNo, LABELS.listNoLine, this.isAnonymous === true)
        ];
    }

    get invoiceOptions() {
        return [
            this.option('invoice', 'yes', LABELS.invoiceYes, LABELS.invoiceYesLine, this.invoiceRequested === true),
            this.option('invoice', 'no', LABELS.invoiceNo, LABELS.invoiceNoLine, this.invoiceRequested === false)
        ];
    }

    option(group, value, title, line, selected) {
        return {
            key: `${group}-${value}`,
            group,
            value,
            title,
            line,
            checked: selected ? 'true' : 'false',
            className: selected ? 'choice choice-on' : 'choice'
        };
    }

    handleChoice(event) {
        const { group, value } = event.currentTarget.dataset;
        if (group === 'list') {
            this.isAnonymous = value === 'anonymous';
        } else {
            this.invoiceRequested = value === 'yes';
        }
        this.attempted = false;
    }

    // ---------- Step 3: data ----------

    get needsPublicName() {
        return this.isAnonymous === false;
    }

    get needsDonorName() {
        // The donation stores the donor's name for credited donations and for any invoice (US-03 refinement 3).
        return this.isAnonymous === false || this.invoiceRequested === true;
    }

    get isInvoice() {
        return this.invoiceRequested === true;
    }

    get isCompany() {
        return this.personType === 'Company';
    }

    get isIndividual() {
        return this.personType === 'Individual';
    }

    get showNameFields() {
        return this.needsDonorName && Boolean(this.personType);
    }

    get showIndividualFields() {
        return this.showNameFields && this.isIndividual;
    }

    get showCompanyFields() {
        return this.showNameFields && this.isCompany;
    }

    get nameNote() {
        // An anonymous invoice: the name goes only on the invoice (US-02 AC3, US-06 AC9).
        return this.isAnonymous === true ? LABELS.nameNoteInvoice : null;
    }

    get personOptions() {
        return [
            { key: 'person-individual', value: 'Individual', label: LABELS.personIndividual },
            { key: 'person-company', value: 'Company', label: LABELS.personCompany }
        ].map((item) => {
            const selected = this.personType === item.value;
            return { ...item, checked: selected, className: selected ? 'radio radio-on' : 'radio' };
        });
    }

    handlePersonType(event) {
        this.personType = event.target.value;
    }

    handleInput(event) {
        const field = event.target.dataset.field;
        let value = event.target.value || '';
        if (field === 'rfc') {
            value = value.toUpperCase().replace(/\s/g, '');
        }
        this[field] = value;
    }

    handleNameBlur() {
        // Suggest the public name from the donor's name; the donor can change it.
        if (!this.needsPublicName || this.publicName.trim()) {
            return;
        }
        const suggestion = this.isCompany
            ? this.company.trim()
            : [this.firstName.trim(), this.lastName.trim()].filter(Boolean).join(' ');
        this.publicName = suggestion.substring(0, MAX_LENGTH.publicName);
    }

    handleConsent(event) {
        this.consent = event.target.checked;
    }

    get maxLength() {
        return MAX_LENGTH;
    }

    get errors() {
        const errors = {};
        const required = (value) => (value && value.trim() ? null : LABELS.errRequired);
        const add = (field, message) => {
            if (message) {
                errors[field] = message;
            }
        };
        add('email', validateEmail(this.email.trim()));
        if (this.needsPublicName) {
            add('publicName', required(this.publicName));
        }
        if (this.needsDonorName) {
            add('personType', this.personType ? null : LABELS.errRequired);
            if (this.isIndividual) {
                add('firstName', required(this.firstName));
                add('lastName', required(this.lastName));
            } else if (this.isCompany) {
                add('company', required(this.company));
            }
        }
        if (this.isInvoice) {
            add('rfc', validateRfc(this.rfc, this.personType));
            add('consent', this.consent ? null : LABELS.errConsent);
        }
        return errors;
    }

    get shownErrors() {
        return this.attempted ? this.errors : {};
    }

    get hasStep3Errors() {
        return Object.keys(this.shownErrors).length > 0;
    }

    get fieldState() {
        const shown = this.shownErrors;
        const state = {};
        ['email', 'publicName', 'personType', 'firstName', 'lastName', 'company', 'rfc', 'consent'].forEach(
            (field) => {
                state[field] = {
                    error: shown[field] || null,
                    invalid: shown[field] ? 'true' : 'false',
                    className: shown[field] ? 'input input-error' : 'input'
                };
            }
        );
        return state;
    }

    focusFirstError() {
        // The errors may not be on screen yet: if no field is marked, try again after the next render.
        if (!this.focusInvalidField()) {
            this.focusPending = true;
        }
    }

    focusInvalidField() {
        const field = this.template.querySelector('[aria-invalid="true"]');
        if (field) {
            field.focus();
        }
        return Boolean(field);
    }

    renderedCallback() {
        if (this.focusPending) {
            this.focusPending = false;
            this.focusInvalidField();
        }
        if (this.focusCustomPending) {
            const input = this.template.querySelector('[data-id="custom-amount"]');
            if (input) {
                this.focusCustomPending = false;
                input.focus();
            }
        }
    }

    // ---------- Step 4: confirmation and payment ----------

    get listSummary() {
        return this.isAnonymous ? LABELS.summaryListAnonymous : this.publicName.trim();
    }

    get invoiceSummary() {
        return this.isInvoice ? LABELS.yes : LABELS.no;
    }

    get invoiceName() {
        if (!this.isInvoice) {
            return null;
        }
        return this.isCompany ? this.company.trim() : `${this.firstName.trim()} ${this.lastName.trim()}`;
    }

    get payLabel() {
        return this.processing ? LABELS.processing : LABELS.pay;
    }

    get trimmedEmail() {
        return this.email.trim();
    }

    async handlePay() {
        if (this.processing) {
            return;
        }
        // US-03 AC4: nothing is created if a field is missing or invalid.
        if (!this.amount || !this.typeChosen || Object.keys(this.errors).length > 0) {
            this.attempted = true;
            this.goToStep(3);
            return;
        }
        this.processing = true;
        this.submitError = '';
        try {
            const checkoutUrl = await startCheckout(this.buildRequest());
            if (!checkoutUrl) {
                throw new Error('No checkout URL');
            }
            window.location.assign(checkoutUrl);
        } catch (error) {
            this.submitError = apexMessage(error) || LABELS.submitError;
            this.processing = false;
        }
    }

    buildRequest() {
        const text = (value) => (value ? value.trim() : null);
        return {
            campaignId: this.campaign.id,
            amount: this.amount,
            email: text(this.email),
            anonymous: this.isAnonymous,
            publicName: this.isAnonymous ? null : text(this.publicName),
            invoice: this.invoiceRequested,
            personType: this.needsDonorName ? this.personType : null,
            firstName: this.showIndividualFields ? text(this.firstName) : null,
            lastName: this.showIndividualFields ? text(this.lastName) : null,
            company: this.showCompanyFields ? text(this.company) : null,
            rfc: this.isInvoice ? text(this.rfc) : null,
            invoiceConsent: this.isInvoice ? this.consent : false
        };
    }
}
