import FaqPage from 'c/faqPage';
import { getSupportEmail } from 'c/donationDataService';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

jest.mock('c/donationDataService', () => ({ getSupportEmail: jest.fn() }));

async function open() {
    const element = mount('c-faq-page', FaqPage);
    await flushPromises();
    return element;
}

describe('c-faq-page', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('shows the title and the ten questions, all closed, with their answers', async () => {
        getSupportEmail.mockResolvedValue(null);
        const element = await open();

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

    it('ends with the support team address, read from the org, as a mail link', async () => {
        getSupportEmail.mockResolvedValue('soporte@example.com');
        const element = await open();

        expect($(element, '.contact-title').textContent).toBe('c.Donations_FaqContactTitle');
        expect($(element, '.contact').textContent).toContain('c.Donations_FaqContactText');
        const link = $(element, '.contact-link');
        expect(link.getAttribute('href')).toBe('mailto:soporte@example.com');
        expect(link.textContent).toBe('soporte@example.com');
        expect($(element, 'form')).toBeNull();
    });

    it('hides the contact box while no support address is set up', async () => {
        getSupportEmail.mockResolvedValue(null);
        const element = await open();

        expect($(element, '.contact')).toBeNull();
        expect($(element, 'a')).toBeNull();
    });

    it('hides the contact box if the address can not be read', async () => {
        getSupportEmail.mockRejectedValue({ body: { message: 'Error' } });
        const element = await open();

        expect($(element, '.contact')).toBeNull();
        expect($$(element, 'details')).toHaveLength(10);
    });
});
