import {
    SUGGESTED_AMOUNTS,
    HIGHLIGHT_AMOUNT,
    formatMoney,
    formatDate,
    pageUrl,
    getParam,
    toCampaignView,
    apexMessage,
    validateEmail,
    validateRfc
} from 'c/donationUtils';
import { CAMPAIGNS, mockLocation } from 'test-utils';

describe('c-donation-utils', () => {
    describe('constants', () => {
        it('offers the eight suggested amounts of US-01 AC7', () => {
            expect(SUGGESTED_AMOUNTS).toEqual([100, 250, 500, 1000, 2000, 5000, 10000, 20000]);
        });

        it('highlights from $1,000 (US-01 AC8)', () => {
            expect(HIGHLIGHT_AMOUNT).toBe(1000);
        });
    });

    describe('formatMoney', () => {
        it('formats pesos with thousands separator and MXN', () => {
            expect(formatMoney(1000)).toBe('$1,000 MXN');
            expect(formatMoney(20000)).toBe('$20,000 MXN');
        });

        it('treats empty values as zero', () => {
            expect(formatMoney(null)).toBe('$0 MXN');
            expect(formatMoney('abc')).toBe('$0 MXN');
        });
    });

    describe('formatDate', () => {
        it('formats in Spanish without shifting the day', () => {
            expect(formatDate('2026-11-20')).toBe('20 de noviembre de 2026');
        });

        it('returns an empty text without a date', () => {
            expect(formatDate(null)).toBe('');
        });
    });

    describe('pageUrl', () => {
        it('builds the address of each page under the site path', () => {
            expect(pageUrl('home')).toBe('/s/');
            expect(pageUrl('past')).toBe('/s/campanas-pasadas');
            expect(pageUrl('campaign', { id: '701A' })).toBe('/s/campana?id=701A');
        });

        it('encodes values and skips empty parameters', () => {
            expect(pageUrl('donate', { campana: 'a b', other: null })).toBe('/s/donar?campana=a%20b');
        });

        it('falls back to the home page for an unknown page', () => {
            expect(pageUrl('nope')).toBe('/s/');
        });
    });

    describe('getParam', () => {
        it('reads a query parameter', () => {
            mockLocation({ search: '?id=701A&x=1' });
            expect(getParam('id')).toBe('701A');
            expect(getParam('missing')).toBeNull();
        });

        it('returns null when the address cannot be read', () => {
            Object.defineProperty(window, 'location', {
                configurable: true,
                get() {
                    throw new Error('blocked');
                }
            });
            expect(getParam('id')).toBeNull();
            mockLocation();
        });
    });

    describe('toCampaignView', () => {
        it('keeps the real percentage over 100% (US-08 AC5)', () => {
            const view = toCampaignView(CAMPAIGNS[0]);
            expect(view.percent).toBe(125);
            expect(view.percentLabel).toBe('125%');
            expect(view.exceeded).toBe(true);
            expect(view.raisedLabel).toBe('$1,250 MXN');
            expect(view.goalLabel).toBe('$1,000 MXN');
            expect(view.hasImage).toBe(false);
            expect(view.pageUrl).toBe(`/s/campana?id=${CAMPAIGNS[0].id}`);
            expect(view.donateUrl).toBe(`/s/donar?campana=${CAMPAIGNS[0].id}`);
        });

        it('labels the general campaign as always open', () => {
            const view = toCampaignView(CAMPAIGNS[1]);
            expect(view.closeLabel).toBe('c.Donations_AlwaysOpen');
            expect(view.exceeded).toBe(false);
            expect(view.hasImage).toBe(true);
        });

        it('labels an active campaign with its end date', () => {
            expect(toCampaignView(CAMPAIGNS[0]).closeLabel).toBe('c.Donations_ClosesOn');
        });

        it('never marks a past campaign as exceeded', () => {
            const view = toCampaignView(CAMPAIGNS[0], true);
            expect(view.exceeded).toBe(false);
            expect(view.closeLabel).toBe('c.Donations_ClosedOn');
        });

        it('shows 0% when there is no goal or end date', () => {
            const view = toCampaignView({ ...CAMPAIGNS[0], goal: 0, endDate: null });
            expect(view.percent).toBe(0);
            expect(view.closeLabel).toBe('c.Donations_AlwaysOpen');
        });
    });

    describe('apexMessage', () => {
        it('reads the message of an AuraHandledException', () => {
            expect(apexMessage({ body: { message: 'Algo falló' } })).toBe('Algo falló');
        });

        it('joins the messages of a list of errors', () => {
            expect(apexMessage({ body: [{ message: 'Uno' }, { message: 'Dos' }] })).toBe('Uno Dos');
        });

        it('returns null when there is no message', () => {
            expect(apexMessage(null)).toBeNull();
            expect(apexMessage({})).toBeNull();
            expect(apexMessage({ body: [] })).toBeNull();
            expect(apexMessage({ body: {} })).toBeNull();
        });
    });

    describe('validateEmail (US-02 AC6, US-03 AC6)', () => {
        it('requires the email', () => {
            expect(validateEmail('')).toBe('c.Donations_ErrRequired');
        });

        it.each(['ana', 'ana@', 'ana@dominio', 'ana @dominio.com'])('rejects %s', (email) => {
            expect(validateEmail(email)).toBe('c.Donations_ErrEmail');
        });

        it('accepts a valid email', () => {
            expect(validateEmail('ana@dominio.com')).toBeNull();
        });
    });

    describe('validateRfc (US-06 AC1, AC2, AC5)', () => {
        it('accepts a valid RFC for each person type', () => {
            expect(validateRfc('GODE561231GR8', 'Individual')).toBeNull();
            expect(validateRfc('ABC010101AB1', 'Company')).toBeNull();
            expect(validateRfc('ÑAB010101AB1', 'Company')).toBeNull();
        });

        it('requires the RFC', () => {
            expect(validateRfc('', 'Individual')).toBe('c.Donations_ErrRequired');
        });

        it('rejects a 12-character RFC for an individual and 13 for a company', () => {
            expect(validateRfc('ABC010101AB1', 'Individual')).toBe('c.Donations_ErrRfcLengthIndividual');
            expect(validateRfc('GODE561231GR8', 'Company')).toBe('c.Donations_ErrRfcLengthCompany');
        });

        it.each([
            ['GODE561331GR8', 'month 13'],
            ['GODE560132GR8', 'day 32'],
            ['GOD1561231GR8', 'digit in the letters'],
            ['GODE561231GR_', 'invalid check digit']
        ])('rejects %s (%s)', (rfc) => {
            expect(validateRfc(rfc, 'Individual')).toBe('c.Donations_ErrRfc');
        });

        it('does not judge the pattern before the person type is known', () => {
            expect(validateRfc('ANYTHING', '')).toBeNull();
        });
    });
});
