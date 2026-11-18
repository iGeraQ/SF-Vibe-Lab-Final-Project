import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';

const QUESTION_COUNT = 10;

/**
 * Frequently asked questions (preguntas-frecuentes page). Static answers from Custom Labels, no Apex
 * and no data access. Each question opens on its own; nothing here is a contact form (US-11 AC6).
 */
export default class FaqPage extends LightningElement {
    labels = LABELS;

    get questions() {
        return Array.from({ length: QUESTION_COUNT }, (unused, index) => ({
            key: `faq-${index + 1}`,
            question: LABELS[`faqQ${index + 1}`],
            answer: LABELS[`faqA${index + 1}`]
        }));
    }
}
