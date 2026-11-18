import { LightningElement } from 'lwc';
import { LABELS } from 'c/donationLabels';
import { PAGES, pageUrl } from 'c/donationUtils';

/**
 * Site header (US-11): program name and the two public links, Campañas and Campañas pasadas.
 * Goes in the theme's header region so every page shows it.
 */
export default class SiteHeader extends LightningElement {
    labels = LABELS;
    homeUrl = pageUrl('home');
    pastUrl = pageUrl('past');

    get isPast() {
        try {
            return window.location.pathname.endsWith(`/${PAGES.past}`);
        } catch {
            return false;
        }
    }

    get homeClass() {
        return this.isPast ? 'nav-link' : 'nav-link nav-link-current';
    }

    get pastClass() {
        return this.isPast ? 'nav-link nav-link-current' : 'nav-link';
    }

    get homeCurrent() {
        return this.isPast ? null : 'page';
    }

    get pastCurrent() {
        return this.isPast ? 'page' : null;
    }
}
