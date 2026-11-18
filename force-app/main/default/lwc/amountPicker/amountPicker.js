import { LightningElement, api } from 'lwc';
import { LABELS } from 'c/donationLabels';
import { SUGGESTED_AMOUNTS, cleanAmountText, formatMoney, parseAmount, validateAmount } from 'c/donationUtils';

// The campaign page's side card shows four larger amounts; the "Otro monto" field covers any other.
const COMPACT_AMOUNTS = [1000, 5000, 10000, 20000];

/**
 * The suggested amounts plus an always visible "Otro monto" field (US-01 AC7, US-13). Used in the donation
 * form's first step and in the campaign page's side card, so a donor who starts on the campaign page skips a
 * step. Choosing an amount clears the field, and typing in the field unselects the amount, so only one is
 * chosen at a time and no extra click is needed to type.
 *
 * Fires "amountchange" with { amount, custom }: amount is the chosen amount, or null while the typed one
 * can't be donated; custom says whether the donor is typing an amount. The parent calls validate() before
 * moving on, which shows why a typed amount isn't valid.
 */
export default class AmountPicker extends LightningElement {
    /** Four amounts in narrower buttons, for the campaign page's side card. */
    @api compact = false;

    labels = LABELS;
    amount = null;
    customText = '';
    // The typed amount's error shows after the donor leaves the field or tries to continue, not while typing.
    customAttempted = false;
    focusCustomPending = false;

    /** The amount to show as chosen, e.g. when the donor comes back to change it. */
    @api
    get value() {
        return this.amount;
    }
    set value(amount) {
        const number = Number(amount);
        if (!amount || !(number > 0)) {
            return;
        }
        this.amount = number;
        this.customText = this.visibleAmounts.includes(number) ? '' : String(number);
    }

    /**
     * Checks that there is an amount that can be donated; if a typed amount isn't valid, shows why and
     * moves the focus to it.
     * @returns {boolean} whether the donor can continue
     */
    @api
    validate() {
        if (this.isCustom && validateAmount(this.customText)) {
            this.customAttempted = true;
            this.focusCustomPending = true;
            return false;
        }
        return Boolean(this.amount);
    }

    get visibleAmounts() {
        return this.compact ? COMPACT_AMOUNTS : SUGGESTED_AMOUNTS;
    }

    get isCustom() {
        return this.customText.trim() !== '';
    }

    get gridClass() {
        return this.compact ? 'amounts amounts-compact' : 'amounts';
    }

    get fieldClass() {
        return this.compact ? 'field custom-field custom-field-compact' : 'field custom-field';
    }

    get amountOptions() {
        return this.visibleAmounts.map((value) => {
            const selected = !this.isCustom && this.amount === value;
            return {
                key: `amount-${value}`,
                value,
                label: formatMoney(value).replace(' MXN', ''),
                pressed: selected ? 'true' : 'false',
                className: selected ? 'amount amount-on' : 'amount'
            };
        });
    }

    get customError() {
        return this.customAttempted && this.isCustom ? validateAmount(this.customText) : null;
    }

    get customInvalid() {
        return this.customError ? 'true' : 'false';
    }

    get customInputClass() {
        if (this.customError) {
            return 'input custom-input input-error';
        }
        return this.isCustom ? 'input custom-input custom-on' : 'input custom-input';
    }

    handleAmount(event) {
        this.customText = '';
        this.customAttempted = false;
        this.amount = Number(event.currentTarget.dataset.value);
        this.notify();
    }

    handleCustomInput(event) {
        // Only a positive number can be typed: anything else is dropped as soon as it is typed or pasted.
        const clean = cleanAmountText(event.target.value);
        if (event.target.value !== clean) {
            event.target.value = clean;
        }
        this.customText = clean;
        // The amount only counts while the typed text can be donated; an empty field means nothing is chosen.
        this.amount = this.isCustom && !validateAmount(this.customText) ? parseAmount(this.customText) : null;
        if (!this.isCustom) {
            this.customAttempted = false;
        }
        this.notify();
    }

    handleCustomBlur() {
        if (this.isCustom) {
            this.customAttempted = true;
        }
    }

    notify() {
        this.dispatchEvent(
            new CustomEvent('amountchange', { detail: { amount: this.amount, custom: this.isCustom } })
        );
    }

    renderedCallback() {
        if (this.focusCustomPending) {
            const input = this.template.querySelector('[data-id="custom-amount"]');
            if (input) {
                this.focusCustomPending = false;
                input.focus();
            }
        }
    }
}
