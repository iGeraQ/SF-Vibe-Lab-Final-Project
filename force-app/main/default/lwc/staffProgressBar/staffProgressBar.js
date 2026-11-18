import { LightningElement, api } from 'lwc';

/**
 * Progress bar of the staff app. Over 100% the bar stays full while screen readers get the real
 * percentage (US-08 AC5). The width is set from JavaScript, not with a style={...} binding.
 */
export default class StaffProgressBar extends LightningElement {
    /** The real percentage, which can be over 100. */
    @api percent = 0;
    /** Accessible name, e.g. "Avance de Transporte". */
    @api label;
    /** Thick bar for the campaign page. */
    @api large = false;
    /** Grey bar for finished or inactive campaigns. */
    @api muted = false;

    get valueNow() {
        return Math.max(0, Number(this.percent) || 0);
    }

    get valueMax() {
        return Math.max(100, this.valueNow);
    }

    get trackClass() {
        return this.large ? 'track track-large' : 'track';
    }

    get barClass() {
        return this.muted ? 'bar bar-muted' : 'bar';
    }

    renderedCallback() {
        const bar = this.template.querySelector('.bar');
        if (bar) {
            bar.style.width = `${Math.min(this.valueNow, 100)}%`;
        }
    }
}
