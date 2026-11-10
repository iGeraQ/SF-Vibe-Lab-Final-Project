import SiteFooter from 'c/siteFooter';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

describe('c-site-footer', () => {
    afterEach(cleanup);

    it('shows the program and the payment note, with no contact link (US-11 AC6)', async () => {
        const element = mount('c-site-footer', SiteFooter);
        await flushPromises();

        expect($(element, 'footer').textContent).toBe('c.Donations_ProgramName · c.Donations_FooterNote');
        expect($(element, 'a')).toBeNull();
    });
});
