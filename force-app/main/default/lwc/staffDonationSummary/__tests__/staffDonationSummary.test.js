import StaffDonationSummary from 'c/staffDonationSummary';
import { getRecord } from 'lightning/uiRecordApi';
import { navigate } from 'lightning/navigation';
import { recordOf } from 'staff-test-data';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

const DONATION = {
    Name: 'D-1045 · Boletos',
    Donation_Reference__c: 'D-1045',
    StageName: 'Pending',
    Amount: 10000,
    Donation_Type__c: 'Factura',
    CampaignId: '701B',
    Campaign: { Name: 'Boletos de acceso al evento' },
    Is_Anonymous__c: false,
    Invoice_Requested__c: true,
    Confirmation_Source__c: null,
    CreatedDate: new Date(2026, 10, 7, 18, 30).toISOString()
};

async function render(changes = {}) {
    const element = mount('c-staff-donation-summary', StaffDonationSummary, { recordId: '006B' });
    getRecord.emit(recordOf({ ...DONATION, ...changes }));
    await flushPromises();
    return element;
}

describe('c-staff-donation-summary', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('shows a loading state, then an error if the donation cannot be read', async () => {
        const element = mount('c-staff-donation-summary', StaffDonationSummary, { recordId: '006B' });
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');

        getRecord.error();
        await flushPromises();
        expect($(element, '[role="alert"]').textContent).toBe('c.Staff_LoadError');
    });

    it('shows campaign, type, amount and status (US-09 AC1)', async () => {
        const element = await render();
        expect($(element, '.campaign').textContent).toBe('Boletos de acceso al evento');
        expect($(element, '.type').textContent).toBe('Factura');
        expect($(element, '.amount').textContent).toBe('$10,000 MXN');
        expect($(element, '.locked .pill').textContent).toBe('c.Staff_StagePending');
    });

    it('shows amount and status as locked, with no way to edit them (US-09 AC3)', async () => {
        const element = await render();
        const captions = $$(element, '.locked .caption').map((p) => p.textContent.trim());
        expect(captions).toEqual(['c.Staff_AmountReadOnly', 'c.Staff_StatusReadOnly']);
        expect($(element, '.note').textContent).toBe('c.Staff_LockedNote');
        expect($(element, 'input')).toBeNull();
    });

    it('flags a pending invoice request (US-07 AC1, AC4)', async () => {
        const element = await render();
        expect($$(element, '.badges li').map((li) => li.textContent)).toEqual([
            'c.Staff_StagePending',
            'c.Staff_BadgeInvoice'
        ]);
        expect($(element, '.confirmation').textContent).toBe('c.Staff_NotConfirmed');
    });

    it('flags an anonymous paid donation and says how it was confirmed', async () => {
        const element = await render({ StageName: 'Paid', Is_Anonymous__c: true, Invoice_Requested__c: false, Confirmation_Source__c: 'Webhook' });
        expect($$(element, '.badges li').map((li) => li.textContent)).toEqual(['c.Staff_BadgeAnonymous']);
        expect($(element, '.confirmation').textContent).toBe('c.Staff_ConfirmedBy');
    });

    it('describes paid donations without a source and expired ones', async () => {
        let element = await render({ StageName: 'Paid', Invoice_Requested__c: false });
        expect($(element, '.badges')).toBeNull();
        expect($(element, '.confirmation').textContent).toBe('c.Staff_StagePaid');
        cleanup();

        element = await render({ StageName: 'Expired' });
        expect($(element, '.confirmation').textContent).toBe('c.Staff_ExpiredNote');
    });

    it('shows the gateway reference and the date to compare with Stripe (US-09 AC5)', async () => {
        const element = await render();
        expect($(element, '.reference').textContent).toBe('D-1045');
        expect($(element, '.date').textContent).toBe('7 nov 2026, 18:30');
    });

    it('falls back to the name and dashes when fields are empty', async () => {
        const element = await render({ Donation_Reference__c: null, Donation_Type__c: null, CampaignId: null, Campaign: null });
        expect($(element, '.reference').textContent).toBe('D-1045 · Boletos');
        expect($(element, '.type').textContent).toBe('c.Staff_NoValue');
        expect($(element, '.campaign')).toBeNull();
    });

    it('opens the campaign', async () => {
        const element = await render();
        $(element, '.campaign').click();
        expect(navigate).toHaveBeenCalledWith(
            { type: 'standard__recordPage', attributes: { recordId: '701B', objectApiName: 'Campaign', actionName: 'view' } },
            undefined
        );
    });
});
