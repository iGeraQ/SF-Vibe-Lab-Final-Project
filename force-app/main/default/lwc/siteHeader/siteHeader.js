import { LightningElement, wire } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { LABELS } from 'c/donationLabels';
import { PAGES, pageUrl } from 'c/donationUtils';

function currentPath() {
    try {
        return window.location.pathname;
    } catch {
        return '';
    }
}

/**
 * Site header (US-11): program name and the public links, Campañas, Logros and Ayuda (FAQ).
 * Goes in the theme's header region so every page shows it. The theme keeps the header alive between
 * pages, so the current link is worked out again each time the site navigates.
 */
export default class SiteHeader extends LightningElement {
    labels = LABELS;
    homeUrl = pageUrl('home');
    pastUrl = pageUrl('past');
    faqUrl = pageUrl('faq');
    path = currentPath();

    @wire(CurrentPageReference)
    handlePageChange() {
        this.path = currentPath();
    }

    /** The nav link of the page on screen; every other page belongs to Campañas. */
    get current() {
        if (this.path.endsWith(`/${PAGES.past}`)) return 'past';
        if (this.path.endsWith(`/${PAGES.faq}`)) return 'faq';
        return 'home';
    }

    linkClass(key, extra = '') {
        return `nav-link${extra}${this.current === key ? ' nav-link-current' : ''}`;
    }

    get homeClass() {
        return this.linkClass('home');
    }

    get pastClass() {
        return this.linkClass('past');
    }

    get faqClass() {
        return this.linkClass('faq', ' nav-link-help');
    }

    get homeCurrent() {
        return this.current === 'home' ? 'page' : null;
    }

    get pastCurrent() {
        return this.current === 'past' ? 'page' : null;
    }

    get faqCurrent() {
        return this.current === 'faq' ? 'page' : null;
    }
}
