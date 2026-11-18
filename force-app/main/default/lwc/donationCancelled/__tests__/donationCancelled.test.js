import DonationCancelled from 'c/donationCancelled';
import { cleanup, flushPromises, mockLocation, mount, $ } from 'test-utils';

describe('c-donation-cancelled', () => {
    afterEach(cleanup);

    it('says no charge was made and retries the same campaign (US-04 AC5)', async () => {
        mockLocation({ search: '?campana=701000000000001AAA' });
        const element = mount('c-donation-cancelled', DonationCancelled);
        await flushPromises();

        expect($(element, 'h1').textContent).toBe('c.Donations_CancelTitle');
        expect($(element, 'a').getAttribute('href')).toBe('/s/donar?campana=701000000000001AAA');
    });

    it('sends to the home page without a campaign', async () => {
        mockLocation({ search: '' });
        const element = mount('c-donation-cancelled', DonationCancelled);
        await flushPromises();

        expect($(element, 'a').getAttribute('href')).toBe('/s/');
    });
});
