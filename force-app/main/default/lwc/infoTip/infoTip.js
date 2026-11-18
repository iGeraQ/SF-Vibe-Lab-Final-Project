import { LightningElement, api } from 'lwc';
import { LABELS } from 'c/donationLabels';

/**
 * Small "i" button that explains a question or field without taking space on the form.
 * Opens on hover, keyboard focus or tap, and closes on Escape, blur or when the mouse leaves.
 * Pass either `text` (one explanation) or `items` ([{ title, text }], one per answer).
 */
export default class InfoTip extends LightningElement {
    @api text;
    @api items;
    @api label = LABELS.moreInfo;

    open = false;
    alignRight = false;

    get hasItems() {
        return Array.isArray(this.items) && this.items.length > 0;
    }

    get expanded() {
        return this.open ? 'true' : 'false';
    }

    get bubbleClass() {
        const classes = ['bubble'];
        if (this.open) classes.push('bubble-open');
        if (this.alignRight) classes.push('bubble-right');
        return classes.join(' ');
    }

    show() {
        // Near the right edge of the screen the bubble opens to the left, so it never leaves the page.
        const button = this.template.querySelector('.tip-button');
        const box = button ? button.getBoundingClientRect() : null;
        this.alignRight = Boolean(box && window.innerWidth && box.left > window.innerWidth / 2);
        this.open = true;
    }

    hide() {
        this.open = false;
    }

    handleKey(event) {
        if (event.key === 'Escape') {
            this.hide();
        }
    }
}
