import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';

/**
 * Site footer. No contact page or link: support goes in the receipt email (US-11 AC6).
 */
export default class SiteFooter extends LightningElement {
    labels = LABELS;
}
