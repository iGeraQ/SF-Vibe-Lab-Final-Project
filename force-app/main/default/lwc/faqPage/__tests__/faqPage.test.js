import FaqPage from 'c/faqPage';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

describe('c-faq-page', () => {
    afterEach(cleanup);

    it('shows the title and the ten questions, all closed, with their answers', async () => {
        const element = mount('c-faq-page', FaqPage);
        await flushPromises();

        expect($(element, 'h1').textContent).toBe('c.Donations_FaqTitle');
        const items = $$(element, 'details');
        expect(items).toHaveLength(10);
        expect(items.every((item) => !item.open)).toBe(true);
        expect($$(element, 'summary').map((node) => node.textContent.trim())).toEqual(
            Array.from({ length: 10 }, (unused, index) => `c.Donations_FaqQ${index + 1}`)
        );
        expect($$(element, '.faq-answer').map((node) => node.textContent)).toEqual(
            Array.from({ length: 10 }, (unused, index) => `c.Donations_FaqA${index + 1}`)
        );
    });

    it('has no form and no contact link (US-11 AC6)', async () => {
        const element = mount('c-faq-page', FaqPage);
        await flushPromises();

        expect($(element, 'form')).toBeNull();
        expect($(element, 'a')).toBeNull();
    });
});
