import {
    campaignSituation,
    edgesOf,
    errorMessage,
    formatDate,
    formatDateTime,
    formatMoney,
    percentOf,
    stageInfo,
    todayIso,
    toCampaignRow,
    toDonationRow,
    valueOf
} from 'c/staffUtils';
import { CAMPAIGNS, DONATIONS, donationNode } from 'staff-test-data';

const TODAY = '2026-11-10';

describe('c/staffUtils', () => {
    it('formats amounts in MXN with thousands separators', () => {
        expect(formatMoney(40000)).toBe('$40,000 MXN');
        expect(formatMoney(1250.5)).toBe('$1,250.5 MXN');
        expect(formatMoney(0)).toBe('$0 MXN');
        expect(formatMoney(null)).toBe('c.Staff_NoValue');
        expect(formatMoney('')).toBe('c.Staff_NoValue');
    });

    it('formats Salesforce dates without a time zone shift', () => {
        expect(formatDate('2026-09-01')).toBe('1 sep 2026');
        expect(formatDate('2027-01-15')).toBe('15 ene 2027');
        expect(formatDate(null)).toBe('c.Staff_NoValue');
    });

    it('formats date times in the local time zone', () => {
        const local = new Date(2026, 10, 8, 8, 5);
        expect(formatDateTime(local.toISOString())).toBe('8 nov 2026, 08:05');
        expect(formatDateTime('not a date')).toBe('c.Staff_NoValue');
        expect(formatDateTime(null)).toBe('c.Staff_NoValue');
    });

    it('gives today as YYYY-MM-DD', () => {
        expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05');
        expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('keeps the percentage over 100 and avoids dividing by zero (US-08 AC5)', () => {
        expect(percentOf(47000, 40000)).toBe(118);
        expect(percentOf(null, 30000)).toBe(0);
        expect(percentOf(100, 0)).toBe(0);
        expect(percentOf(100, null)).toBe(0);
    });

    it.each([
        [{ isActive: true, startDate: '2026-09-01', endDate: '2027-01-15' }, 'active'],
        [{ isActive: true, startDate: '2026-12-01', endDate: '2027-01-31' }, 'upcoming'],
        [{ isActive: true, startDate: '2026-03-01', endDate: '2026-06-30' }, 'finished'],
        [{ isActive: false, startDate: '2026-10-15', endDate: '2026-12-15' }, 'inactive'],
        [{ isActive: false, startDate: '2026-03-01', endDate: '2026-06-30' }, 'finished'],
        [{ isActive: true, startDate: TODAY, endDate: TODAY }, 'active']
    ])('works out the campaign situation %o → %s (US-08 AC4, AC7)', (campaign, expected) => {
        expect(campaignSituation(campaign, TODAY)).toBe(expected);
    });

    it('uses today when no date is given', () => {
        expect(campaignSituation({ isActive: true })).toBe('active');
    });

    it('maps donation statuses to labels and pills', () => {
        expect(stageInfo('Paid')).toEqual({ label: 'c.Staff_StagePaid', pill: 'pill pill-success' });
        expect(stageInfo('Pending').pill).toBe('pill pill-warning');
        expect(stageInfo('Expired').label).toBe('c.Staff_StageExpired');
        expect(stageInfo('Other')).toEqual({ label: 'Other', pill: 'pill pill-neutral' });
        expect(stageInfo(undefined).label).toBe('c.Staff_NoValue');
    });

    it('builds a campaign row', () => {
        const row = toCampaignRow(CAMPAIGNS[0], TODAY);
        expect(row).toMatchObject({
            id: '701A',
            name: 'Transporte y hospedaje',
            situation: 'active',
            situationLabel: 'c.Staff_SituationActive',
            startLabel: '1 sep 2026',
            endLabel: '15 ene 2027',
            goalLabel: '$40,000 MXN',
            raisedLabel: '$47,000 MXN',
            percent: 118,
            percentLabel: '118%',
            muted: false
        });
        expect(toCampaignRow(CAMPAIGNS[1], TODAY).raisedLabel).toBe('$0 MXN');
        expect(toCampaignRow(CAMPAIGNS[3], TODAY).muted).toBe(true);
    });

    it('builds donation rows, with the invoice name, RFC and consent (US-07 AC1, AC3)', () => {
        const company = toDonationRow(DONATIONS[1]);
        expect(company).toMatchObject({
            reference: 'D-1045',
            stage: 'Pending',
            stageLabel: 'c.Staff_StagePending',
            amountLabel: '$10,000 MXN',
            type: 'Factura',
            campaign: 'Boletos de acceso al evento',
            invoice: true,
            isAnonymous: false,
            personType: 'Persona moral',
            invoiceName: 'Ficticia SA de CV',
            rfc: 'FIC010101AB1',
            consentLabel: 'c.Staff_Yes'
        });
        expect(toDonationRow(DONATIONS[2]).invoiceName).toBe('Ana Prueba');
        const plain = toDonationRow(DONATIONS[0]);
        expect(plain.invoiceName).toBe('c.Staff_NoValue');
        expect(plain.rfc).toBe('c.Staff_NoValue');
        expect(plain.consentLabel).toBe('c.Staff_No');
        expect(plain.personType).toBe('c.Staff_NoValue');
    });

    it('falls back to the record name and dashes when fields are missing', () => {
        const row = toDonationRow(donationNode({ id: '006X', Name: 'D-1 · X', campaign: null }));
        expect(row.reference).toBe('D-1 · X');
        expect(row.campaign).toBe('c.Staff_NoValue');
        expect(row.type).toBe('c.Staff_NoValue');
        expect(row.amountLabel).toBe('c.Staff_NoValue');
    });

    it('reads GraphQL values and edges safely', () => {
        expect(valueOf({ Name: { value: 'x' } }, 'Name')).toBe('x');
        expect(valueOf(null, 'Name')).toBeNull();
        expect(edgesOf({ edges: [{ node: { Id: '1' } }] })).toEqual([{ Id: '1' }]);
        expect(edgesOf(undefined)).toEqual([]);
    });

    it('turns save errors into a clear message', () => {
        const fieldError = { body: { output: { fieldErrors: { Public_Name__c: [{ message: 'Nombre obligatorio' }] } } } };
        expect(errorMessage(fieldError, 'fallback')).toBe('Nombre obligatorio');
        const pageError = { body: { output: { errors: [{ message: 'Regla' }], fieldErrors: {} } } };
        expect(errorMessage(pageError, 'fallback')).toBe('Regla');
        expect(errorMessage({ body: { message: 'Sin acceso' } }, 'fallback')).toBe('Sin acceso');
        expect(errorMessage(new Error('stack'), 'fallback')).toBe('fallback');
    });
});
