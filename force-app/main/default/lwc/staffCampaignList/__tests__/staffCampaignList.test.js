import StaffCampaignList from 'c/staffCampaignList';
import { graphql } from 'lightning/graphql';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { navigate } from 'lightning/navigation';
import { CAMPAIGNS, campaignNode, freezeToday } from 'staff-test-data';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

function emitCampaigns(nodes = CAMPAIGNS, hasNextPage = false, refresh) {
    graphql.emit(
        { uiapi: { query: { Campaign: { edges: nodes.map((node) => ({ node })), pageInfo: { hasNextPage } } } } },
        undefined,
        refresh
    );
}

function tabs(element) {
    return $$(element, '[role="tab"]').map((tab) => ({
        text: tab.textContent,
        selected: tab.getAttribute('aria-selected')
    }));
}

function names(element) {
    return $$(element, 'tbody tr .link').map((link) => link.textContent.trim());
}

describe('c-staff-campaign-list', () => {
    beforeEach(freezeToday);

    afterEach(() => {
        cleanup();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('shows a loading state until the campaigns arrive', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');
    });

    it('splits campaigns into Activas, Próximas, Finalizadas and Todas with their counts (US-08 AC4, AC7)', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns();
        await flushPromises();

        expect(tabs(element)).toEqual([
            { text: 'c.Staff_TabActive1', selected: 'true' },
            { text: 'c.Staff_TabUpcoming1', selected: 'false' },
            { text: 'c.Staff_TabFinished1', selected: 'false' },
            { text: 'c.Staff_TabAll4', selected: 'false' }
        ]);
        expect(names(element)).toEqual(['Transporte y hospedaje']);

        $$(element, '[role="tab"]')[1].click();
        await flushPromises();
        expect(names(element)).toEqual(['Comidas durante el evento']);
        expect($(element, 'tbody .pill').textContent).toBe('c.Staff_SituationUpcoming');

        $$(element, '[role="tab"]')[2].click();
        await flushPromises();
        expect(names(element)).toEqual(['Laptops de préstamo']);

        $$(element, '[role="tab"]')[3].click();
        await flushPromises();
        expect(names(element)).toHaveLength(4);
        expect(element.shadowRoot.textContent).toContain('c.Staff_SituationInactive');
    });

    it('shows goal, raised amount and progress, which keeps counting past 100% (US-08 AC2, AC5)', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns();
        await flushPromises();

        const cells = $$(element, 'tbody tr td').map((td) => td.textContent.trim());
        expect(cells).toEqual([
            'Transporte y hospedaje',
            'c.Staff_SituationActive',
            '1 sep 2026',
            '15 ene 2027',
            '$40,000 MXN',
            '$47,000 MXN',
            '118%'
        ]);
        const bar = $(element, 'c-staff-progress-bar');
        expect(bar.percent).toBe(118);
        expect(bar.label).toBe('c.Staff_ProgressOf');
    });

    it('shows the empty message when a tab has no campaigns', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns([campaignNode({ id: '701Z', Name: 'Vieja', IsActive: true, EndDate: '2020-01-01' })]);
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_CampaignsEmpty');
    });

    it('shows a clear error if the campaigns cannot be read', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        graphql.emitErrors([{ message: 'internal' }]);
        await flushPromises();
        const error = $(element, '[role="alert"]');
        expect(error.textContent).toBe('c.Staff_LoadError');
        expect(element.shadowRoot.textContent).not.toContain('internal');
    });

    it('only offers "Nueva campaña" to users who can create campaigns (US-08 AC6)', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns();
        getObjectInfo.emit({ createable: false });
        await flushPromises();
        expect($(element, '.new-campaign')).toBeNull();

        getObjectInfo.emit({ createable: true });
        await flushPromises();
        $(element, '.new-campaign').click();
        expect(navigate).toHaveBeenCalledWith(
            { type: 'standard__objectPage', attributes: { objectApiName: 'Campaign', actionName: 'new' } },
            undefined
        );
    });

    it('opens a campaign from its name or row', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns();
        await flushPromises();

        $(element, 'tbody .link').click();
        $(element, 'tbody tr').click();
        expect(navigate).toHaveBeenCalledTimes(2);
        expect(navigate.mock.calls[0][0]).toEqual({
            type: 'standard__recordPage',
            attributes: { recordId: '701A', objectApiName: 'Campaign', actionName: 'view' }
        });
    });

    it('refreshes the data and warns when there are more than 200 campaigns', async () => {
        const refresh = jest.fn().mockResolvedValue();
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        emitCampaigns(CAMPAIGNS, true, refresh);
        await flushPromises();

        expect($(element, '.note').textContent).toBe('c.Staff_FirstRecords');
        $(element, '.refresh').click();
        expect(refresh).toHaveBeenCalled();

        // A later emission without refresh must not disable the button.
        emitCampaigns(CAMPAIGNS, true);
        await flushPromises();
        $(element, '.refresh').click();
        expect(refresh).toHaveBeenCalledTimes(2);
    });

    it('does nothing on refresh before the data arrives', async () => {
        const element = mount('c-staff-campaign-list', StaffCampaignList);
        await flushPromises();
        expect(() => $(element, '.refresh').click()).not.toThrow();
    });
});
