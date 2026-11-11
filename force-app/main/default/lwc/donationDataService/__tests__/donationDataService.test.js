import {
    getActiveCampaigns,
    getPastCampaigns,
    getRecognition,
    startCheckout,
    confirmCheckout
} from 'c/donationDataService';
import apexGetActiveCampaigns from '@salesforce/apex/PublicCampaignController.getActiveCampaigns';
import apexGetPastCampaigns from '@salesforce/apex/PublicCampaignController.getPastCampaigns';
import apexGetRecognition from '@salesforce/apex/PublicCampaignController.getRecognition';
import apexStartCheckout from '@salesforce/apex/DonationCheckoutService.startCheckout';
import apexConfirmCheckout from '@salesforce/apex/DonationCheckoutService.confirmCheckout';

jest.mock('@salesforce/apex/PublicCampaignController.getActiveCampaigns', () => ({ default: jest.fn() }), {
    virtual: true
});
jest.mock('@salesforce/apex/PublicCampaignController.getPastCampaigns', () => ({ default: jest.fn() }), {
    virtual: true
});
jest.mock('@salesforce/apex/PublicCampaignController.getRecognition', () => ({ default: jest.fn() }), {
    virtual: true
});
jest.mock('@salesforce/apex/DonationCheckoutService.startCheckout', () => ({ default: jest.fn() }), {
    virtual: true
});
jest.mock('@salesforce/apex/DonationCheckoutService.confirmCheckout', () => ({ default: jest.fn() }), {
    virtual: true
});

const CAMPAIGN = {
    id: '701000000000001AAA',
    name: 'Transporte y hospedaje',
    description: 'Campaña de prueba.',
    imageUrl: null,
    purpose: 'Autobús y hospedaje.',
    endDate: '2026-11-18',
    goal: 40000,
    raised: 12000,
    progress: 30
};
const SERVER_ERROR = { body: { message: 'No pudimos abrir la pasarela de pago. Intenta de nuevo en unos minutos.' } };

describe('c-donation-data-service (Apex)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('gets the active campaigns from PublicCampaignController (US-01 AC1)', async () => {
        apexGetActiveCampaigns.mockResolvedValue([CAMPAIGN]);

        await expect(getActiveCampaigns()).resolves.toEqual([CAMPAIGN]);
        expect(apexGetActiveCampaigns).toHaveBeenCalledTimes(1);
    });

    it('gets the past campaigns from PublicCampaignController (US-01 AC6)', async () => {
        apexGetPastCampaigns.mockResolvedValue([]);

        await expect(getPastCampaigns()).resolves.toEqual([]);
        expect(apexGetPastCampaigns).toHaveBeenCalledTimes(1);
    });

    it('asks for one campaign recognition by id (US-05)', async () => {
        const recognition = { donors: [{ name: 'Ana', amount: 500 }], anonymousTotal: 200 };
        apexGetRecognition.mockResolvedValue(recognition);

        await expect(getRecognition(CAMPAIGN.id)).resolves.toEqual(recognition);
        expect(apexGetRecognition).toHaveBeenCalledWith({ campaignId: CAMPAIGN.id });
    });

    it('sends the form as the DonationRequest and returns the Stripe address (US-03 AC1)', async () => {
        const request = { campaignId: CAMPAIGN.id, amount: 500, email: 'ana@dominio.com', anonymous: true, invoice: false };
        apexStartCheckout.mockResolvedValue('https://checkout.stripe.com/c/pay/cs_test_123');

        await expect(startCheckout(request)).resolves.toBe('https://checkout.stripe.com/c/pay/cs_test_123');
        expect(apexStartCheckout).toHaveBeenCalledWith({ request });
    });

    it('passes the server message through when checkout fails', async () => {
        apexStartCheckout.mockRejectedValue(SERVER_ERROR);

        await expect(startCheckout({ campaignId: CAMPAIGN.id, amount: 500 })).rejects.toEqual(SERVER_ERROR);
    });

    it('confirms a session by its id and returns the status (US-04)', async () => {
        apexConfirmCheckout.mockResolvedValue('Paid');

        await expect(confirmCheckout('cs_test_123')).resolves.toBe('Paid');
        expect(apexConfirmCheckout).toHaveBeenCalledWith({ sessionId: 'cs_test_123' });
    });

    it('passes the server message through when the session is unknown', async () => {
        const notFound = { body: { message: 'No encontramos tu donación.' } };
        apexConfirmCheckout.mockRejectedValue(notFound);

        await expect(confirmCheckout('cs_other')).rejects.toEqual(notFound);
    });
});
