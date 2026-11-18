import SiteHeader from 'c/siteHeader';
import { cleanup, flushPromises, mockLocation, mount, $, $$ } from 'test-utils';

describe('c-site-header', () => {
    afterEach(cleanup);

    it('shows the program and only the two public links (US-11 AC2)', async () => {
        mockLocation({ pathname: '/s/' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();

        expect($(element, '.brand-name').textContent).toBe('c.Donations_ProgramName');
        const links = $$(element, 'nav a');
        expect(links.map((link) => link.getAttribute('href'))).toEqual(['/s/', '/s/campanas-pasadas']);
    });

    it('marks Campañas as current outside the past campaigns page', async () => {
        mockLocation({ pathname: '/s/campana' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[0].getAttribute('aria-current')).toBe('page');
        expect(links[1].hasAttribute('aria-current')).toBe(false);
    });

    it('marks Campañas pasadas as current on its page', async () => {
        mockLocation({ pathname: '/s/campanas-pasadas' });
        const element = mount('c-site-header', SiteHeader);
        await flushPromises();
        const links = $$(element, 'nav a');

        expect(links[1].getAttribute('aria-current')).toBe('page');
        expect(links[1].className).toContain('nav-link-current');
        expect(links[0].hasAttribute('aria-current')).toBe(false);
    });
});
