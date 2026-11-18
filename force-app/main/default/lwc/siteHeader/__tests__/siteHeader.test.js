import SiteHeader from 'c/siteHeader';
import { CurrentPageReference } from 'lightning/navigation';
import { cleanup, flushPromises, mockLocation, mount, $, $$ } from 'test-utils';

describe('c-site-header', () => {
    afterEach(cleanup);

    it('shows the program and only the public links (US-11 AC2)', async () => {
        mockLocation({ pathname: '/s/' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();

        expect($(element, '.brand-name').textContent).toBe('c.Donations_ProgramName');
        const links = $$(element, 'nav a');
        expect(links.map((link) => link.getAttribute('href'))).toEqual([
            '/s/',
            '/s/campanas-pasadas',
            '/s/preguntas-frecuentes'
        ]);
        expect(links[2].textContent.trim()).toBe('c.Donations_NavHelp');
    });

    it('marks Ayuda as current on the FAQ page', async () => {
        mockLocation({ pathname: '/s/preguntas-frecuentes' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[2].getAttribute('aria-current')).toBe('page');
        expect(links[2].className).toContain('nav-link-current');
        expect(links[0].hasAttribute('aria-current')).toBe(false);
        expect(links[1].hasAttribute('aria-current')).toBe(false);
    });

    it('marks Campañas as current outside the past campaigns page', async () => {
        mockLocation({ pathname: '/s/campana' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[0].getAttribute('aria-current')).toBe('page');
        expect(links[1].hasAttribute('aria-current')).toBe(false);
    });

    it('moves the current link when the site navigates without reloading the header', async () => {
        const location = mockLocation({ pathname: '/s/' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        expect($$(element, 'nav a')[0].getAttribute('aria-current')).toBe('page');

        location.pathname = '/s/campanas-pasadas';
        CurrentPageReference.emit({ type: 'comm__namedPage', attributes: { name: 'Logros' } });
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[1].getAttribute('aria-current')).toBe('page');
        expect(links[1].className).toContain('nav-link-current');
        expect(links[0].hasAttribute('aria-current')).toBe(false);
    });

    it('marks Logros as current on its page', async () => {
        mockLocation({ pathname: '/s/campanas-pasadas' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[1].getAttribute('aria-current')).toBe('page');
        expect(links[1].className).toContain('nav-link-current');
        expect(links[0].hasAttribute('aria-current')).toBe(false);
    });
});
