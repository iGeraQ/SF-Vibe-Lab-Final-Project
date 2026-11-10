import PageNotFound from 'c/pageNotFound';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

describe('c-page-not-found', () => {
    afterEach(cleanup);

    it('explains the page is not available and links to the home page (US-11 AC5)', async () => {
        const element = mount('c-page-not-found', PageNotFound);
        await flushPromises();

        expect($(element, 'h1').textContent).toBe('c.Donations_NotFoundTitle');
        expect($(element, 'a').getAttribute('href')).toBe('/s/');
    });
});
