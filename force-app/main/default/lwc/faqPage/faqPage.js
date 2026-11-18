import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';
import { getSupportEmail } from 'c/donationDataService';

const QUESTION_COUNT = 10;

/**
 * Frequently asked questions (preguntas-frecuentes page). Static answers from Custom Labels, and below them the
 * support team's address, read from the org (the receipt's sender) so it never lives in the public repo.
 * With no address set up, or if it can't be read, the contact box is simply not shown.
 */
export default class FaqPage extends LightningElement {
    labels = LABELS;
    supportEmail = null;

    connectedCallback() {
        getSupportEmail()
            .then((email) => {
                this.supportEmail = email || null;
            })
            .catch(() => {
                this.supportEmail = null;
            });
    }

    get questions() {
        return Array.from({ length: QUESTION_COUNT }, (unused, index) => ({
            key: `faq-${index + 1}`,
            question: LABELS[`faqQ${index + 1}`],
            answer: LABELS[`faqA${index + 1}`]
        }));
    }

    get hasSupportEmail() {
        return Boolean(this.supportEmail);
    }

    get supportHref() {
        return `mailto:${this.supportEmail}`;
    }
}
