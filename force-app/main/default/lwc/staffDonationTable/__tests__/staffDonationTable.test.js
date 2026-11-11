import StaffDonationTable from 'c/staffDonationTable';
import { navigate } from 'lightning/navigation';
import { toDonationRow } from 'c/staffUtils';
import { DONATIONS } from 'staff-test-data';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

const ROWS = DONATIONS.map(toDonationRow);

function headers(element) {
    return $$(element, 'th').map((th) => th.textContent);
}

describe('c-staff-donation-table', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('shows status, amount, type, campaign and date of each donation (US-09 AC1)', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, { rows: ROWS });
        await flushPromises();

        expect(headers(element)).toEqual([
            'c.Staff_ColId',
            'c.Staff_ColStatus',
            'c.Staff_ColAmount',
            'c.Staff_ColType',
            'c.Staff_ColCampaign',
            'c.Staff_ColDate'
        ]);
        const cells = $$(element, 'tbody tr')[1].querySelectorAll('td');
        expect(cells[0].textContent.trim()).toBe('D-1045');
        expect(cells[1].textContent).toBe('c.Staff_StagePending');
        expect(cells[1].querySelector('span').className).toBe('pill pill-warning');
        expect(cells[2].textContent).toBe('$10,000 MXN');
        expect(cells[3].textContent).toBe('Factura');
        expect(cells[4].textContent).toBe('Boletos de acceso al evento');
    });

    it('shows name or company, RFC, person type and consent for invoice requests (US-07 AC1, AC3)', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, { rows: [ROWS[1]], variant: 'invoice' });
        await flushPromises();

        expect(headers(element)).toEqual([
            'c.Staff_ColId',
            'c.Staff_ColStatus',
            'c.Staff_ColAmount',
            'c.Staff_ColPersonType',
            'c.Staff_ColInvoiceName',
            'c.Staff_ColRfc',
            'c.Staff_ColConsent',
            'c.Staff_ColCampaign',
            'c.Staff_ColDate'
        ]);
        const text = $(element, 'tbody tr').textContent;
        expect(text).toContain('Persona moral');
        expect(text).toContain('Ficticia SA de CV');
        expect(text).toContain('FIC010101AB1');
        expect(text).toContain('c.Staff_Yes');
    });

    it('hides the campaign column inside a campaign and drops the border in a card', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, {
            rows: ROWS,
            variant: 'campaign',
            flush: true
        });
        await flushPromises();
        expect(headers(element)).not.toContain('c.Staff_ColCampaign');
        expect($(element, '.table-wrap').classList).toContain('table-flush');
    });

    it('opens the donation from the reference or the row', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, { rows: ROWS });
        await flushPromises();

        $(element, 'tbody tr button').click();
        $$(element, 'tbody tr')[2].click();

        expect(navigate).toHaveBeenCalledTimes(2);
        expect(navigate.mock.calls[0][0]).toEqual({
            type: 'standard__recordPage',
            attributes: { recordId: '006A', objectApiName: 'Opportunity', actionName: 'view' }
        });
        expect(navigate.mock.calls[1][0].attributes.recordId).toBe('006C');
    });

    it('ignores a click without a record id', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, { rows: [{ ...ROWS[0], id: '' }] });
        await flushPromises();
        $(element, 'tbody tr').click();
        expect(navigate).not.toHaveBeenCalled();
    });

    it('shows the empty message, default or given', async () => {
        const element = mount('c-staff-donation-table', StaffDonationTable, { rows: [] });
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_DonationsEmpty');

        element.emptyLabel = 'Nada aquí';
        await flushPromises();
        expect($(element, '.state').textContent).toBe('Nada aquí');

        element.rows = undefined;
        await flushPromises();
        expect($(element, 'table')).toBeNull();
    });
});
