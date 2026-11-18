import StaffCampaignDonations from 'c/staffCampaignDonations';
import { graphql } from 'lightning/graphql';
import { DONATIONS } from 'staff-test-data';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

function emit(nodes, hasNextPage = false) {
    graphql.emit({ uiapi: { query: { Opportunity: { edges: nodes.map((node) => ({ node })), pageInfo: { hasNextPage } } } } });
}

describe('c-staff-campaign-donations', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('asks only for the donations of this campaign', async () => {
        mount('c-staff-campaign-donations', StaffCampaignDonations, { recordId: '701A' });
        await flushPromises();
        expect(graphql.getLastConfig().variables).toEqual({ campaignId: '701A' });
    });

    it('shows the campaign donations with their count, without the campaign column', async () => {
        const element = mount('c-staff-campaign-donations', StaffCampaignDonations, { recordId: '701A' });
        emit(DONATIONS.slice(2));
        await flushPromises();

        expect($(element, 'h2').textContent).toBe('c.Staff_CampaignDonations (2)');
        const table = $(element, 'c-staff-donation-table');
        expect(table.variant).toBe('campaign');
        expect(table.flush).toBe(true);
        expect(table.rows.map((row) => row.reference)).toEqual(['D-1048', 'D-1042']);
        expect($(element, '.more')).toBeNull();
    });

    it('shows loading, errors and the 200-record note', async () => {
        const element = mount('c-staff-campaign-donations', StaffCampaignDonations, { recordId: '701A' });
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');

        graphql.emitErrors([{ message: 'x' }]);
        await flushPromises();
        expect($(element, '[role="alert"]').textContent).toBe('c.Staff_LoadError');

        emit(DONATIONS, true);
        await flushPromises();
        expect($(element, '.more').textContent).toBe('c.Staff_FirstRecords');
    });
});
