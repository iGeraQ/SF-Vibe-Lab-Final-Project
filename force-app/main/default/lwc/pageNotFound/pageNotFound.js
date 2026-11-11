import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';
import { pageUrl } from 'c/donationUtils';

/**
 * The site's error page: any other address, staff pages included, lands here (US-11 AC5, US-12 AC8).
 */
export default class PageNotFound extends LightningElement {
    labels = LABELS;
    homeUrl = pageUrl('home');
}
