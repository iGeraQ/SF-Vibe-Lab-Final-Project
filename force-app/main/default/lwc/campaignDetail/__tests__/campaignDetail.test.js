import CampaignDetail from 'c/campaignDetail';
import { getActiveCampaigns, getRecognition } from 'c/donationDataService';
import { CAMPAIGNS, cleanup, flushPromises, mockLocation, mount, $ } from 'test-utils';

jest.mock('c/donationDataService', () => ({
    getActiveCampaigns: jest.fn(),
    getRecognition: jest.fn()
}));

describe('c-campaign-detail', () => {
    beforeEach(() => {
        getActiveCampaigns.mockResolvedValue(CAMPAIGNS);
        getRecognition.mockResolvedValue({ donors: [], anonymousTotal: 0 });
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    async function open(id) {
        mockLocation({ search: `?id=${id}` });
        const element = mount('c-campaign-detail', CampaignDetail);
        await flushPromises();
        return element;
    }

    it('shows everything the campaign page needs (US-01 AC5)', async () => {
        const element = await open(CAMPAIGNS[0].id);
        const text = element.shadowRoot.textContent;

        expect($(element, 'h1').textContent).toBe(CAMPAIGNS[0].name);
        expect(text).toContain(CAMPAIGNS[0].description);
        expect(text).toContain(CAMPAIGNS[0].purpose);
        expect(text).toContain('$1,250 MXN');
        expect($(element, '.badge-exceeded')).not.toBeNull();
        expect($(element, '.btn-primary').getAttribute('href')).toBe(`/s/donar?campana=${CAMPAIGNS[0].id}`);
    });

    it('loads the donor recognition of the same campaign', async () => {
        const element = await open(CAMPAIGNS[0].id);
        const recognition = $(element, 'c-donor-recognition');

        expect(recognition.campaignId).toBe(CAMPAIGNS[0].id);
        expect(recognition.donateUrl).toBe(`/s/donar?campana=${CAMPAIGNS[0].id}`);
        expect(getRecognition).toHaveBeenCalledWith(CAMPAIGNS[0].id);
    });

    it('shows "not available" for a past or unknown campaign (US-01 AC6)', async () => {
        const element = await open('701000000000099AAA');

        expect($(element, 'c-donor-recognition')).toBeNull();
        expect($(element, 'h1').textContent).toBe('c.Donations_CampaignNotAvailable');
    });

    it('shows a loading state, then a clear error if the data fails', async () => {
        let fail;
        getActiveCampaigns.mockReturnValue(
            new Promise((resolve, reject) => {
                fail = reject;
            })
        );
        mockLocation({ search: `?id=${CAMPAIGNS[0].id}` });
        const element = mount('c-campaign-detail', CampaignDetail);
        expect($(element, '[role="status"]')).not.toBeNull();

        fail(new Error('boom'));
        await flushPromises();
        expect($(element, '[role="alert"]')).not.toBeNull();
    });
});
