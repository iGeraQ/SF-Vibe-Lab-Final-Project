import CampaignList from 'c/campaignList';
import { getActiveCampaigns, getPastCampaigns } from 'c/donationDataService';
import { CAMPAIGNS, cleanup, flushPromises, mockLocation, mount, $, $$ } from 'test-utils';

jest.mock('c/donationDataService', () => ({
    getActiveCampaigns: jest.fn(),
    getPastCampaigns: jest.fn()
}));

describe('c-campaign-list', () => {
    let location;

    beforeEach(() => {
        location = mockLocation();
        getActiveCampaigns.mockResolvedValue(CAMPAIGNS);
        getPastCampaigns.mockResolvedValue([CAMPAIGNS[0]]);
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    describe('active mode', () => {
        it('shows a loading state until the data arrives', () => {
            getActiveCampaigns.mockReturnValue(new Promise(() => {}));
            const element = mount('c-campaign-list', CampaignList);
            expect($(element, '[role="status"]')).not.toBeNull();
        });

        it('shows one card per active campaign (US-01 AC1)', async () => {
            const element = mount('c-campaign-list', CampaignList);
            await flushPromises();

            expect(getPastCampaigns).not.toHaveBeenCalled();
            expect($(element, 'h1').textContent).toBe('c.Donations_ActiveTitle');
            const cards = $$(element, 'c-campaign-card');
            expect(cards).toHaveLength(2);
            expect(cards[0].past).toBe(false);
            expect(location.replace).not.toHaveBeenCalled();
        });

        it('opens the only active campaign directly (US-01 AC4)', async () => {
            getActiveCampaigns.mockResolvedValue([CAMPAIGNS[0]]);
            mount('c-campaign-list', CampaignList);
            await flushPromises();

            expect(location.replace).toHaveBeenCalledWith(`/s/campana?id=${CAMPAIGNS[0].id}`);
        });

        it('does not redirect inside the Experience Builder preview', async () => {
            location = mockLocation({ hostname: 'org.livepreview.salesforce-experience.com' });
            getActiveCampaigns.mockResolvedValue([CAMPAIGNS[0]]);
            const element = mount('c-campaign-list', CampaignList);
            await flushPromises();

            expect(location.replace).not.toHaveBeenCalled();
            expect($$(element, 'c-campaign-card')).toHaveLength(1);
        });

        it('shows a clear error when the campaigns cannot load', async () => {
            getActiveCampaigns.mockRejectedValue({ body: { message: 'boom' } });
            const element = mount('c-campaign-list', CampaignList);
            await flushPromises();

            expect($(element, '[role="alert"]').textContent).toBe('c.Donations_LoadError');
        });
    });

    describe('past mode', () => {
        it('shows finished campaigns as past cards (US-01 AC6)', async () => {
            const element = mount('c-campaign-list', CampaignList, { mode: 'past' });
            await flushPromises();

            expect(getActiveCampaigns).not.toHaveBeenCalled();
            expect($(element, 'h1').textContent).toBe('c.Donations_PastTitle');
            const cards = $$(element, 'c-campaign-card');
            expect(cards).toHaveLength(1);
            expect(cards[0].past).toBe(true);
            expect($(element, '.grid-past')).not.toBeNull();
            expect(location.replace).not.toHaveBeenCalled();
        });

        it('says when there are no past campaigns yet', async () => {
            getPastCampaigns.mockResolvedValue([]);
            const element = mount('c-campaign-list', CampaignList, { mode: 'past' });
            await flushPromises();

            expect(element.shadowRoot.textContent).toContain('c.Donations_PastEmpty');
        });

        it('shows a clear error when past campaigns cannot load', async () => {
            getPastCampaigns.mockRejectedValue(new Error('boom'));
            const element = mount('c-campaign-list', CampaignList, { mode: 'past' });
            await flushPromises();

            expect($(element, '[role="alert"]')).not.toBeNull();
        });
    });
});
