/**
 * Fictitious records for the staff component tests. Imported as 'staff-test-data' (see jest.config.js).
 */

/** Wraps plain values in GraphQL's { value } shape. */
function wrap(values) {
    return Object.fromEntries(
        Object.entries(values).map(([key, value]) =>
            value !== null && typeof value === 'object' && !Array.isArray(value) ? [key, value] : [key, { value }]
        )
    );
}

export function campaignNode({ id, ...values }) {
    return { Id: id, ...wrap(values) };
}

export function donationNode({ id, campaign = 'Campaña general', personType = null, ...values }) {
    return {
        Id: id,
        ...wrap(values),
        Person_Type__c: { value: personType, displayValue: personType === 'Company' ? 'Persona moral' : personType && 'Persona física' },
        Campaign: campaign ? { Name: { value: campaign } } : null
    };
}

/** Today in the tests: Nov 10, 2026. */
export const TODAY = new Date(2026, 10, 10, 12, 0, 0);

/** Freezes Date at TODAY but keeps real timers, which flushPromises needs. */
export function freezeToday() {
    jest.useFakeTimers({
        now: TODAY,
        doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'nextTick', 'queueMicrotask']
    });
}

export const CAMPAIGNS = [
    campaignNode({
        id: '701A',
        Name: 'Transporte y hospedaje',
        IsActive: true,
        StartDate: '2026-09-01',
        EndDate: '2027-01-15',
        ExpectedRevenue: 40000,
        AmountWonOpportunities: 47000
    }),
    campaignNode({
        id: '701B',
        Name: 'Comidas durante el evento',
        IsActive: true,
        StartDate: '2026-12-01',
        EndDate: '2027-01-31',
        ExpectedRevenue: 30000,
        AmountWonOpportunities: null
    }),
    campaignNode({
        id: '701C',
        Name: 'Laptops de préstamo',
        IsActive: true,
        StartDate: '2026-03-01',
        EndDate: '2026-06-30',
        ExpectedRevenue: 60000,
        AmountWonOpportunities: 31000
    }),
    campaignNode({
        id: '701D',
        Name: 'Kits de bienvenida',
        IsActive: false,
        StartDate: '2026-10-15',
        EndDate: '2026-12-15',
        ExpectedRevenue: 16000,
        AmountWonOpportunities: 0
    })
];

export const DONATIONS = [
    donationNode({
        id: '006A',
        Name: 'D-1035 · Campaña general',
        Donation_Reference__c: 'D-1035',
        StageName: 'Pending',
        Amount: 500,
        Donation_Type__c: 'Acreditada',
        CreatedDate: '2026-11-08T14:05:00.000Z',
        Is_Anonymous__c: false,
        Invoice_Requested__c: false
    }),
    donationNode({
        id: '006B',
        Name: 'D-1045 · Boletos',
        campaign: 'Boletos de acceso al evento',
        Donation_Reference__c: 'D-1045',
        StageName: 'Pending',
        Amount: 10000,
        Donation_Type__c: 'Factura',
        CreatedDate: '2026-11-07T18:30:00.000Z',
        Is_Anonymous__c: false,
        Invoice_Requested__c: true,
        personType: 'Company',
        Donor_Company__c: 'Ficticia SA de CV',
        RFC__c: 'FIC010101AB1',
        Invoice_Consent__c: true
    }),
    donationNode({
        id: '006C',
        Name: 'D-1048 · Transporte',
        campaign: 'Transporte y hospedaje',
        Donation_Reference__c: 'D-1048',
        StageName: 'Paid',
        Amount: 20000,
        Donation_Type__c: 'Anónima con factura',
        CreatedDate: '2026-11-06T10:42:00.000Z',
        Is_Anonymous__c: true,
        Invoice_Requested__c: true,
        personType: 'Individual',
        Donor_First_Name__c: 'Ana',
        Donor_Last_Name__c: 'Prueba',
        RFC__c: 'PUAA800101AB1',
        Invoice_Consent__c: true
    }),
    donationNode({
        id: '006D',
        Name: 'D-1042 · Transporte',
        campaign: 'Transporte y hospedaje',
        Donation_Reference__c: 'D-1042',
        StageName: 'Expired',
        Amount: 250,
        Donation_Type__c: 'Anónima',
        CreatedDate: '2026-10-30T22:47:00.000Z',
        Is_Anonymous__c: true,
        Invoice_Requested__c: false
    })
];

/** A getRecord response with the given fields: { Name: 'x', Campaign: { Name: 'y' } }. */
export function recordOf(fields) {
    const toField = (value) =>
        value !== null && typeof value === 'object' && !Array.isArray(value)
            ? { value: recordOf(value), displayValue: null }
            : { value, displayValue: null };
    return { fields: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, toField(value)])) };
}

