import { LightningElement, api } from 'lwc';

const SIZES = ['small', 'medium', 'large'];

/**
 * A campaign's progress bar. Over 100% the bar stays full while screen readers get the real percentage
 * (US-08 AC5). The width is set from JavaScript instead of a style={...} binding in the template, which
 * editors flag as invalid CSS.
 */
export default class ProgressBar extends LightningElement {
    /** The real percentage, which can be over 100. */
    @api percent = 0;
    /** Accessible name, e.g. "Avance de Transporte". */
    @api label;
    /** small, medium or large. */
    @api size = 'medium';
    /** Grey bar for finished campaigns. */
    @api muted = false;

    get valueNow() {
        return Math.max(0, Number(this.percent) || 0);
    }

    get valueMax() {
        return Math.max(100, this.valueNow);
    }

    get width() {
        return `${Math.min(this.valueNow, 100)}%`;
    }

    get trackClass() {
        const size = SIZES.includes(this.size) ? this.size : 'medium';
        return `track track-${size}`;
    }

    get barClass() {
        return this.muted ? 'bar bar-muted' : 'bar';
    }

    renderedCallback() {
        const bar = this.template.querySelector('.bar');
        if (bar) {
            bar.style.width = this.width;
        }
    }
}
