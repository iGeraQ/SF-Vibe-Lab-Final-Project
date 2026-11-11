import DonorRecognition from 'c/donorRecognition';
import { getRecognition } from 'c/donationDataService';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

jest.mock('c/donationDataService', () => ({ getRecognition: jest.fn() }));

const CAMPAIGN_ID = '701000000000001AAA';

function donors(count) {
    return Array.from({ length: count }, (item, index) => ({ name: `Donante ${index + 1}`, amount: 100 * (index + 1) }));
}

describe('c-donor-recognition', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    async function render(recognition) {
        getRecognition.mockResolvedValue(recognition);
        const element = mount('c-donor-recognition', DonorRecognition, {
            campaignId: CAMPAIGN_ID,
            donateUrl: '/s/donar?campana=x'
        });
        await flushPromises();
        return element;
    }

    it('asks for the recognition of this campaign', async () => {
        await render({ donors: [], anonymousTotal: 0 });
        expect(getRecognition).toHaveBeenCalledWith(CAMPAIGN_ID);
    });

    it('lists each credited donor with name and amount (US-05 AC1, AC2)', async () => {
        const element = await render({ donors: donors(2), anonymousTotal: 0 });
        const rows = $$(element, '.donors .donor');

        expect(rows).toHaveLength(2);
        expect(rows[0].textContent).toBe('Donante 1$100 MXN');
        expect($(element, '.anonymous')).toBeNull();
        expect($(element, '.ticker-on')).toBeNull();
    });

    it('shows names as plain text, never as HTML (US-12 AC7)', async () => {
        const element = await render({
            donors: [{ name: '<img src=x onerror=alert(1)>', amount: 500 }],
            anonymousTotal: 0
        });

        expect($(element, '.donor-name').textContent).toBe('<img src=x onerror=alert(1)>');
        expect($(element, 'img')).toBeNull();
    });

    it('shows the anonymous total apart from the list, with no names (US-05 AC8, US-02 AC7)', async () => {
        const element = await render({ donors: donors(1), anonymousTotal: 2500 });

        expect($(element, '.anonymous').textContent).toBe('c.Donations_AnonymousDonors$2,500 MXN');
        expect($$(element, '.donors .donor')).toHaveLength(1);
    });

    it('shows only the anonymous total when nobody asked for credit', async () => {
        const element = await render({ donors: [], anonymousTotal: 300 });

        expect($(element, '.ticker')).toBeNull();
        expect($(element, '.anonymous')).not.toBeNull();
        expect($(element, '.empty')).toBeNull();
    });

    it('invites to donate when there are no paid donations yet', async () => {
        const element = await render({ donors: [], anonymousTotal: 0 });

        expect($(element, '.empty-title').textContent).toBe('c.Donations_BeFirst');
        expect($(element, '.empty a').getAttribute('href')).toBe('/s/donar?campana=x');
    });

    it('scrolls by itself when the donors do not fit (US-05 AC4)', async () => {
        const element = await render({ donors: donors(8), anonymousTotal: 0 });
        const lists = $$(element, 'ul');

        expect($(element, '.ticker-on')).not.toBeNull();
        expect($(element, '.ticker-track').getAttribute('style')).toContain('animation-duration: 24s');
        expect(lists).toHaveLength(2);
        expect(lists[1].getAttribute('aria-hidden')).toBe('true');
    });

    it('shows a loading state, then a clear error if the data fails', async () => {
        let fail;
        getRecognition.mockReturnValue(
            new Promise((resolve, reject) => {
                fail = reject;
            })
        );
        const element = mount('c-donor-recognition', DonorRecognition, { campaignId: CAMPAIGN_ID });
        expect($(element, '[role="status"]')).not.toBeNull();

        fail(new Error('boom'));
        await flushPromises();
        expect($(element, '[role="alert"]')).not.toBeNull();
    });
});
