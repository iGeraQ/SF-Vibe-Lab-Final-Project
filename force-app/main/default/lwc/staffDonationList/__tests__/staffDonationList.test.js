import StaffDonationList from 'c/staffDonationList';
import { graphql } from 'lightning/graphql';
import { DONATIONS } from 'staff-test-data';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

function emitDonations(nodes = DONATIONS, hasNextPage = false, refresh) {
    graphql.emit(
        { uiapi: { query: { Opportunity: { edges: nodes.map((node) => ({ node })), pageInfo: { hasNextPage } } } } },
        undefined,
        refresh
    );
}

async function openTab(element, index) {
    $$(element, '[role="tab"]')[index].click();
    await flushPromises();
    return $(element, 'c-staff-donation-table');
}

describe('c-staff-donation-list', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('shows a loading state until the donations arrive', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');
    });

    it('lists every donation in "Todas" with counts per tab (US-09 AC1)', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations();
        await flushPromises();

        expect($$(element, '[role="tab"]').map((tab) => tab.textContent)).toEqual([
            'c.Staff_TabAll4',
            'c.Staff_TabPaid1',
            'c.Staff_TabPending2',
            'c.Staff_TabExpired1',
            'c.Staff_TabInvoice2',
            'c.Staff_TabAnonymous2'
        ]);
        const table = $(element, 'c-staff-donation-table');
        expect(table.variant).toBe('all');
        expect(table.rows.map((row) => row.reference)).toEqual(['D-1035', 'D-1045', 'D-1048', 'D-1042']);
    });

    it.each([
        [1, ['D-1048']],
        [2, ['D-1035', 'D-1045']],
        [3, ['D-1042']],
        [5, ['D-1048', 'D-1042']]
    ])('filters by tab %i', async (index, expected) => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations();
        await flushPromises();
        const table = await openTab(element, index);
        expect(table.rows.map((row) => row.reference)).toEqual(expected);
        expect($$(element, '[role="tab"]')[index].getAttribute('aria-selected')).toBe('true');
    });

    it('shows only invoice requests in "Solicitan factura", with their invoice columns (US-07 AC2)', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations();
        await flushPromises();
        const table = await openTab(element, 4);
        expect(table.variant).toBe('invoice');
        expect(table.rows.every((row) => row.invoice)).toBe(true);
    });

    it('lets staff tell a pending invoice request from a paid one (US-07 AC4)', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations();
        await flushPromises();
        const table = await openTab(element, 4);
        expect(table.rows.map((row) => [row.reference, row.stageLabel])).toEqual([
            ['D-1045', 'c.Staff_StagePending'],
            ['D-1048', 'c.Staff_StagePaid']
        ]);
    });

    it('shows a clear error if the donations cannot be read', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        graphql.emitErrors([{ message: 'no access' }]);
        await flushPromises();
        expect($(element, '[role="alert"]').textContent).toBe('c.Staff_LoadError');
        expect($(element, 'c-staff-donation-table')).toBeNull();
    });

    it('refreshes and warns when there are more than 200 donations', async () => {
        const refresh = jest.fn().mockResolvedValue();
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations(DONATIONS, true, refresh);
        await flushPromises();
        expect($(element, '.note').textContent).toBe('c.Staff_FirstRecords');
        $(element, '.refresh').click();
        expect(refresh).toHaveBeenCalled();
    });

    it('falls back to "Todas" for an unknown tab', async () => {
        const element = mount('c-staff-donation-list', StaffDonationList);
        emitDonations();
        await flushPromises();
        const tab = $$(element, '[role="tab"]')[1];
        tab.dataset.value = 'unknown';
        tab.click();
        await flushPromises();
        expect($(element, 'c-staff-donation-table').rows).toHaveLength(4);
    });
});
