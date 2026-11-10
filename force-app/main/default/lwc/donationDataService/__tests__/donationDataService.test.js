import {
    getActiveCampaigns,
    getPastCampaigns,
    getRecognition,
    startCheckout,
    confirmCheckout
} from 'c/donationDataService';
import { MOCK_ACTIVE_CAMPAIGNS, MOCK_PAST_CAMPAIGNS, MOCK_RECOGNITION } from 'c/donationMockData';

const request = (overrides = {}) => ({
    campaignId: 'mock-transporte',
    amount: 500,
    email: 'ana@dominio.com',
    anonymous: true,
    invoice: false,
    ...overrides
});

describe('c-donation-data-service (mock data)', () => {
    describe('campaigns', () => {
        it('returns the active campaigns with the controller shape', async () => {
            const campaigns = await getActiveCampaigns();

            expect(campaigns.length).toBeGreaterThan(1);
            campaigns.forEach((campaign) => {
                expect(Object.keys(campaign).sort()).toEqual(
                    ['description', 'endDate', 'goal', 'id', 'imageUrl', 'name', 'progress', 'purpose', 'raised'].sort()
                );
            });
        });

        it('includes the always-open general campaign (US-08 AC8)', async () => {
            const campaigns = await getActiveCampaigns();
            expect(campaigns.some((campaign) => campaign.endDate === '2099-12-31')).toBe(true);
        });

        it('includes one campaign over its goal and one without donors, to show both states', async () => {
            const campaigns = await getActiveCampaigns();
            expect(campaigns.some((campaign) => campaign.raised > campaign.goal)).toBe(true);
            expect(campaigns.some((campaign) => campaign.raised === 0)).toBe(true);
        });

        it('returns past campaigns that ended', async () => {
            const campaigns = await getPastCampaigns();
            expect(campaigns.length).toBeGreaterThan(0);
            campaigns.forEach((campaign) => expect(campaign.endDate < '2026-11-09').toBe(true));
        });

        it('returns copies, so a page cannot change the shared data', async () => {
            const campaigns = await getActiveCampaigns();
            campaigns[0].name = 'Cambiado';
            expect(MOCK_ACTIVE_CAMPAIGNS[0].name).not.toBe('Cambiado');
            expect(await getPastCampaigns()).toEqual(MOCK_PAST_CAMPAIGNS);
        });
    });

    describe('recognition', () => {
        it('matches each campaign raised amount: named donors plus the anonymous total', async () => {
            for (const campaign of MOCK_ACTIVE_CAMPAIGNS) {
                // eslint-disable-next-line no-await-in-loop
                const recognition = await getRecognition(campaign.id);
                const sum = recognition.donors.reduce((total, donor) => total + donor.amount, recognition.anonymousTotal);
                expect(sum).toBe(campaign.raised);
            }
        });

        it('exposes only display name and amount (US-05 AC2)', async () => {
            const recognition = await getRecognition('mock-transporte');
            recognition.donors.forEach((donor) => expect(Object.keys(donor).sort()).toEqual(['amount', 'name']));
            expect(recognition.donors.length).toBeGreaterThan(5);
            expect(recognition.anonymousTotal).toBeGreaterThan(0);
        });

        it('returns an empty recognition for an unknown campaign', async () => {
            expect(await getRecognition('nope')).toEqual({ donors: [], anonymousTotal: 0 });
            expect(MOCK_RECOGNITION.nope).toBeUndefined();
        });
    });

    describe('startCheckout', () => {
        it('goes to the thank-you page with a session id', async () => {
            await expect(startCheckout(request())).resolves.toBe('/s/gracias?session_id=cs_mock_mock-transporte');
        });

        it('lands on the payment-not-completed page for a "cancelar@" email, like Stripe without a campaign', async () => {
            await expect(startCheckout(request({ email: 'cancelar@dominio.com' }))).resolves.toBe('/s/pago-no-completado');
        });

        it('fails like the server for an "error@" email', async () => {
            await expect(startCheckout(request({ email: 'error@dominio.com' }))).rejects.toEqual({
                body: { message: 'No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.' }
            });
        });

        it('rejects a campaign that does not accept donations (US-01 AC6)', async () => {
            await expect(startCheckout(request({ campaignId: 'mock-pasada-laptops' }))).rejects.toHaveProperty(
                'body.message'
            );
        });

        it('rejects an amount under $10 MXN, like DonationCheckoutService', async () => {
            await expect(startCheckout(request({ amount: 9 }))).rejects.toEqual({
                body: { message: 'El monto mínimo es de $10 MXN.' }
            });
            await expect(startCheckout(request({ amount: null }))).rejects.toHaveProperty('body.message');
            await expect(startCheckout(request({ amount: 10 }))).resolves.toContain('/s/gracias');
        });

        it('handles a request without email', async () => {
            await expect(startCheckout(request({ email: null }))).resolves.toContain('/s/gracias');
        });
    });

    describe('confirmCheckout', () => {
        it('returns the status of a mock session', async () => {
            await expect(confirmCheckout('cs_mock_mock-boletos')).resolves.toBe('Paid');
        });

        it('fails like the backend for an unknown session', async () => {
            await expect(confirmCheckout('cs_other')).rejects.toEqual({ body: { message: 'No encontramos tu donación.' } });
            await expect(confirmCheckout(null)).rejects.toHaveProperty('body.message');
        });
    });
});
