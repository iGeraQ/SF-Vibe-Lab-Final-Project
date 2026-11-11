import StaffCampaignProgress from 'c/staffCampaignProgress';
import { getRecord } from 'lightning/uiRecordApi';
import { freezeToday, recordOf } from 'staff-test-data';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

const CAMPAIGN = {
    Name: 'Transporte y hospedaje',
    IsActive: true,
    StartDate: '2026-09-01',
    EndDate: '2027-01-15',
    ExpectedRevenue: 40000,
    AmountWonOpportunities: 47000
};

async function render(fields) {
    const element = mount('c-staff-campaign-progress', StaffCampaignProgress, { recordId: '701A' });
    getRecord.emit(recordOf(fields));
    await flushPromises();
    return element;
}

describe('c-staff-campaign-progress', () => {
    beforeEach(freezeToday);

    afterEach(() => {
        cleanup();
        jest.useRealTimers();
    });

    it('shows a loading state, then an error if the campaign cannot be read', async () => {
        const element = mount('c-staff-campaign-progress', StaffCampaignProgress, { recordId: '701A' });
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');

        getRecord.error();
        await flushPromises();
        expect($(element, '[role="alert"]').textContent).toBe('c.Staff_LoadError');
    });

    it('shows that an active campaign takes donations today, with its dates (US-08 AC7)', async () => {
        const element = await render(CAMPAIGN);
        expect($(element, '.pill').textContent).toBe('c.Staff_SituationActive');
        expect($(element, '.pill').className).toBe('pill pill-success');
        expect($(element, '.schedule').textContent).toBe('1 sep 2026 – 15 ene 2027');
        expect($(element, '.rule').textContent).toBe('c.Staff_ActiveRule c.Staff_GoalPolicy');
    });

    it('keeps counting past 100% of the goal (US-08 AC5)', async () => {
        const element = await render(CAMPAIGN);
        expect($(element, '.raised').textContent).toBe('$47,000 MXN');
        expect($(element, '.percent').textContent).toBe('118%');
        expect($(element, '.goal').textContent).toBe('$40,000 MXN');
        const bar = $(element, 'c-staff-progress-bar');
        expect(bar.percent).toBe(118);
        expect(bar.muted).toBe(false);
        expect(bar.large).toBe(true);
    });

    it.each([
        [{ StartDate: '2026-12-01' }, 'c.Staff_SituationUpcoming', false],
        [{ IsActive: false }, 'c.Staff_SituationInactive', true],
        [{ EndDate: '2026-06-30' }, 'c.Staff_SituationFinished', true]
    ])('shows other situations: %o (US-08 AC4, AC7)', async (changes, label, muted) => {
        const element = await render({ ...CAMPAIGN, ...changes });
        expect($(element, '.pill').textContent).toBe(label);
        expect($(element, 'c-staff-progress-bar').muted).toBe(muted);
    });

    it('treats a campaign with nothing raised as 0%', async () => {
        const element = await render({ ...CAMPAIGN, AmountWonOpportunities: null });
        expect($(element, '.raised').textContent).toBe('$0 MXN');
        expect($(element, '.percent').textContent).toBe('0%');
    });
});
