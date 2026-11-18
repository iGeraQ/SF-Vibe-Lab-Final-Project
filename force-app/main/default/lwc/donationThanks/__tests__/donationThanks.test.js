import DonationThanks from 'c/donationThanks';
import { confirmCheckout } from 'c/donationDataService';
import { cleanup, flushPromises, mockLocation, mount, $ } from 'test-utils';

jest.mock('c/donationDataService', () => ({ confirmCheckout: jest.fn() }));

describe('c-donation-thanks', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('asks the backend to apply the Stripe session status (US-04 AC1)', async () => {
        mockLocation({ search: '?session_id=cs_test_123' });
        confirmCheckout.mockResolvedValue('Paid');
        mount('c-donation-thanks', DonationThanks);
        await flushPromises();

        expect(confirmCheckout).toHaveBeenCalledWith('cs_test_123');
    });

    it.each(['Paid', 'Pending', 'Expired'])(
        'shows the same text whatever the status (%s): never "confirmed", no personal data (US-04 AC2, AC3, AC6)',
        async (status) => {
            mockLocation({ search: '?session_id=cs_test_123' });
            confirmCheckout.mockResolvedValue(status);
            const element = mount('c-donation-thanks', DonationThanks);
            await flushPromises();

            expect($(element, 'h1').textContent).toBe('c.Donations_ThanksTitle');
            expect($(element, '.lead').textContent).toBe('c.Donations_ThanksText');
            expect(element.shadowRoot.textContent).not.toContain(status);
            expect(element.shadowRoot.textContent).not.toContain('@');
        }
    );

    it('still thanks the donor if the check fails', async () => {
        mockLocation({ search: '?session_id=cs_test_123' });
        confirmCheckout.mockRejectedValue({ body: { message: 'No encontramos tu donación.' } });
        const element = mount('c-donation-thanks', DonationThanks);
        await flushPromises();

        expect($(element, 'h1').textContent).toBe('c.Donations_ThanksTitle');
        expect($(element, '[role="alert"]')).toBeNull();
    });

    it('does not call the backend without a session id', async () => {
        mockLocation({ search: '' });
        const element = mount('c-donation-thanks', DonationThanks);
        await flushPromises();

        expect(confirmCheckout).not.toHaveBeenCalled();
        expect($(element, 'a').getAttribute('href')).toBe('/s/');
    });
});
