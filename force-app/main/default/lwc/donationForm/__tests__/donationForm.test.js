import DonationForm from 'c/donationForm';
import { getActiveCampaigns, startCheckout } from 'c/donationDataService';
import { CAMPAIGNS, cleanup, flushPromises, mockLocation, mount, $, $$ } from 'test-utils';

jest.mock('c/donationDataService', () => ({
    getActiveCampaigns: jest.fn(),
    startCheckout: jest.fn()
}));

const CAMPAIGN = CAMPAIGNS[0];
const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_test_123';

// Indexes of the step 2 options: list (credited, anonymous), then invoice (yes, no).
const CREDITED = 0;
const ANONYMOUS = 1;
const INVOICE = 2;
const NO_INVOICE = 3;

describe('c-donation-form', () => {
    let location;

    beforeEach(() => {
        location = mockLocation({ search: `?campana=${CAMPAIGN.id}` });
        window.scrollTo = jest.fn();
        getActiveCampaigns.mockResolvedValue(CAMPAIGNS);
        startCheckout.mockResolvedValue(CHECKOUT_URL);
    });

    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    // ---------- helpers ----------

    async function open() {
        const element = mount('c-donation-form', DonationForm);
        await flushPromises();
        return element;
    }

    const primaryButton = (element) => $$(element, '.buttons .btn-primary').pop();

    async function click(node) {
        node.click();
        await flushPromises();
    }

    async function next(element) {
        await click(primaryButton(element));
    }

    // The amount buttons and the typed amount live in c-amount-picker.
    const picker = (element) => $(element, 'c-amount-picker').shadowRoot;
    const amounts = (element) => [...picker(element).querySelectorAll('.amount')];
    const pickerErrors = (element) => [...picker(element).querySelectorAll('.field-error')].map((node) => node.textContent);

    async function chooseAmount(element, index) {
        await click(amounts(element)[index]);
    }

    async function chooseType(element, list, invoice) {
        await click($$(element, '.choice')[list]);
        await click($$(element, '.choice')[invoice]);
    }

    async function type(element, field, value) {
        const input = $(element, `[data-field="${field}"]`);
        input.value = value;
        input.dispatchEvent(new CustomEvent('input'));
        await flushPromises();
    }

    async function blur(element, field) {
        $(element, `[data-field="${field}"]`).dispatchEvent(new CustomEvent('blur'));
        await flushPromises();
    }

    async function choosePerson(element, personType) {
        const radio = $$(element, 'input[name="person-type"]').find((input) => input.value === personType);
        radio.checked = true;
        radio.dispatchEvent(new CustomEvent('change'));
        await flushPromises();
    }

    async function tickConsent(element, checked = true) {
        const box = $(element, '.consent input');
        box.checked = checked;
        box.dispatchEvent(new CustomEvent('change'));
        await flushPromises();
    }

    const errors = (element) => $$(element, '.field-error').map((node) => node.textContent);
    const currentStep = (element) => $(element, '[aria-current="step"]').textContent;

    /** Goes to step 2 with the given amount and answers its two type questions (the data is on the same step). */
    async function toData(element, amountIndex, list, invoice) {
        await chooseAmount(element, amountIndex);
        await next(element);
        await chooseType(element, list, invoice);
    }

    // ---------- campaign ----------

    describe('campaign', () => {
        it('shows the campaign being donated to', async () => {
            const element = await open();

            expect($(element, '.side-name').textContent).toBe(CAMPAIGN.name);
            expect($(element, '.back-link').getAttribute('href')).toBe(`/s/campana?id=${CAMPAIGN.id}`);
        });

        it('shows the program logo and name above the steps, hidden from screen readers', async () => {
            const element = await open();

            expect($(element, '.wizard-logo').getAttribute('aria-hidden')).toBe('true');
            expect($(element, '.wizard-logo svg')).not.toBeNull();
            expect($(element, '.wizard-brand-name').textContent).toBe('c.Donations_ProgramName');
        });

        it('shows the campaign image beside the form, and the placeholder if it fails to load', async () => {
            mockLocation({ search: `?campana=${CAMPAIGNS[1].id}` });
            const element = await open();
            expect($(element, '.side-image img').getAttribute('src')).toBe(CAMPAIGNS[1].imageUrl);

            $(element, '.side-image img').dispatchEvent(new CustomEvent('error'));
            await flushPromises();

            expect($(element, '.side-image img')).toBeNull();
            expect($(element, '.side-image svg')).not.toBeNull();
        });

        it('does not let anyone donate to a past or unknown campaign (US-01 AC6)', async () => {
            mockLocation({ search: '?campana=701000000000099AAA' });
            const element = await open();

            expect($(element, '.amount')).toBeNull();
            expect($(element, 'h1').textContent).toBe('c.Donations_CampaignNotAvailable');
        });

        it('shows a loading state, then a clear error if the campaigns fail', async () => {
            let fail;
            getActiveCampaigns.mockReturnValue(
                new Promise((resolve, reject) => {
                    fail = reject;
                })
            );
            const element = mount('c-donation-form', DonationForm);
            expect($(element, '[role="status"]')).not.toBeNull();

            fail(new Error('boom'));
            await flushPromises();
            expect($(element, '[role="alert"]').textContent).toBe('c.Donations_LoadError');
        });
    });

    // ---------- step 1 ----------

    describe('step 1: amount', () => {
        it('offers the eight suggested amounts (US-01 AC7)', async () => {
            const element = await open();
            const labels = amounts(element).map((button) => button.textContent);

            expect(labels).toEqual([
                '$100MXN',
                '$250MXN',
                '$500MXN',
                '$1,000MXN',
                '$2,000MXN',
                '$5,000MXN',
                '$10,000MXN',
                '$20,000MXN'
            ]);
            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
        });

        it('does not continue until an amount is chosen', async () => {
            const element = await open();

            expect(primaryButton(element).disabled).toBe(true);
            expect($(element, '.hint').textContent).toBe('c.Donations_AmountHint');
            await chooseAmount(element, 2);
            expect(primaryButton(element).disabled).toBe(false);
            expect(amounts(element)[2].getAttribute('aria-pressed')).toBe('true');
            expect(element.shadowRoot.textContent).toContain('$500 MXN');
        });
    });

    // ---------- step 1: custom amount ----------

    describe('step 1: custom amount (US-13)', () => {
        const customInput = (element) => picker(element).querySelector('[data-id="custom-amount"]');

        async function typeAmount(element, value) {
            const input = customInput(element);
            input.value = value;
            input.dispatchEvent(new CustomEvent('input'));
            await flushPromises();
        }

        async function blurAmount(element) {
            customInput(element).dispatchEvent(new CustomEvent('blur'));
            await flushPromises();
        }

        // The field is always on screen, so typing needs no extra click.
        const openCustom = open;

        it('always shows the "Otro monto" field, ready to type in', async () => {
            const element = await open();

            expect(customInput(element)).not.toBeNull();
            expect(picker(element).querySelector('.custom-field .field-label').textContent).toBe('c.Donations_AmountOther');
            expect(picker(element).querySelector('.custom-field .field-note').textContent).toBe('c.Donations_AmountCustomNote');

            await typeAmount(element, '7');
            expect($(element, '.hint')).toBeNull();
            expect(primaryButton(element).disabled).toBe(false);

            await typeAmount(element, '');
            expect($(element, '.hint').textContent).toBe('c.Donations_AmountHint');
            expect(primaryButton(element).disabled).toBe(true);
        });

        it('does not continue with zero, a negative number or text, and says why (AC5)', async () => {
            const element = await openCustom();

            for (const value of ['0', '-50', 'cien', '10.555']) {
                // eslint-disable-next-line no-await-in-loop
                await typeAmount(element, value);
                // eslint-disable-next-line no-await-in-loop
                await next(element);
                expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
                expect(pickerErrors(element)).toEqual(['c.Donations_ErrAmountInvalid']);
                expect(customInput(element).getAttribute('aria-invalid')).toBe('true');
            }
        });

        it('does not continue under $10 MXN and shows the minimum (AC2)', async () => {
            const element = await openCustom();
            await typeAmount(element, '9.99');
            await next(element);

            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(pickerErrors(element)).toEqual(['c.Donations_ErrAmountMin']);
        });

        it('does not continue with more digits than Stripe accepts (AC3)', async () => {
            const element = await openCustom();
            await typeAmount(element, '1000000');
            await next(element);

            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(pickerErrors(element)).toEqual(['c.Donations_ErrAmountMax']);
            expect(startCheckout).not.toHaveBeenCalled();
        });

        it('waits until the donor leaves the field before showing an error', async () => {
            const element = await openCustom();
            await typeAmount(element, '5');
            expect(pickerErrors(element)).toEqual([]);

            await blurAmount(element);
            expect(pickerErrors(element)).toEqual(['c.Donations_ErrAmountMin']);

            await typeAmount(element, '50');
            expect(pickerErrors(element)).toEqual([]);
        });

        it('keeps only one amount chosen: typing unselects the button and a button clears the field', async () => {
            const element = await open();
            await chooseAmount(element, 1);
            await typeAmount(element, '75');

            expect(amounts(element)[1].getAttribute('aria-pressed')).toBe('false');
            expect(element.shadowRoot.textContent).toContain('$75 MXN');

            await chooseAmount(element, 1);
            expect(customInput(element).value).toBe('');
            expect(amounts(element)[1].getAttribute('aria-pressed')).toBe('true');
            expect(element.shadowRoot.textContent).toContain('$250 MXN');
        });

        it('confirms and sends exactly the typed amount, with centavos (AC1, AC4, AC6)', async () => {
            const element = await openCustom();
            await typeAmount(element, '$1,500.50');
            expect(element.shadowRoot.textContent).toContain('$1,500.50 MXN');
            await next(element);
            await chooseType(element, ANONYMOUS, INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await choosePerson(element, 'Company');
            await type(element, 'company', 'Software del Sureste');
            await type(element, 'rfc', 'ABC010101AB1');
            await tickConsent(element);
            await next(element);

            expect(currentStep(element)).toBe('3. c.Donations_StepConfirm');
            expect($(element, '.summary-big dd').textContent).toBe('$1,500.50 MXN');

            await click(primaryButton(element));
            expect(startCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 1500.5 }));
        });

        it('keeps the typed amount when the donor comes back to change it', async () => {
            const element = await openCustom();
            await typeAmount(element, '120');
            await next(element);
            await click($(element, '.buttons .btn-secondary'));

            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(customInput(element).value).toBe('120');
        });
    });

    // ---------- step 2 ----------

    describe('step 2: list and invoice', () => {
        it('asks two separate questions and needs both answers', async () => {
            const element = await open();
            await chooseAmount(element, 0);
            await next(element);

            expect($$(element, 'legend.question-title').map((node) => node.textContent)).toEqual([
                'c.Donations_ListQuestion',
                'c.Donations_InvoiceQuestion'
            ]);
            expect(primaryButton(element).disabled).toBe(true);
            await click($$(element, '.choice')[ANONYMOUS]);
            expect(primaryButton(element).disabled).toBe(true);
            expect($(element, '.hint').textContent).toBe('c.Donations_TypeHint');
            await click($$(element, '.choice')[NO_INVOICE]);
            expect(primaryButton(element).disabled).toBe(false);
            expect($$(element, '.choice')[ANONYMOUS].getAttribute('aria-checked')).toBe('true');
        });

        it('keeps the answers short and explains only the chosen one', async () => {
            const element = await open();
            await chooseAmount(element, 0);
            await next(element);

            expect($$(element, '.choice-note')).toEqual([]);
            expect(element.shadowRoot.textContent).not.toContain('c.Donations_ListNoLine');

            await chooseType(element, ANONYMOUS, INVOICE);
            expect($$(element, '.choice-note').map((node) => node.textContent)).toEqual([
                'c.Donations_ListNoLine',
                'c.Donations_InvoiceYesLine'
            ]);
        });

        it('goes back to the amount keeping the choice', async () => {
            const element = await open();
            await chooseAmount(element, 4);
            await next(element);
            await click($(element, '.buttons-left .btn-secondary'));

            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(amounts(element)[4].getAttribute('aria-pressed')).toBe('true');
        });
    });

    // ---------- fewer clicks ----------

    describe('fewer clicks', () => {
        it('has three steps, with the type questions and the data on the same page', async () => {
            const element = await open();
            expect($$(element, '.step').map((node) => node.textContent)).toEqual([
                '1. c.Donations_StepAmount',
                '2. c.Donations_StepData',
                '3. c.Donations_StepConfirm'
            ]);

            await chooseAmount(element, 0);
            await next(element);
            expect($$(element, 'legend.question-title').length).toBe(2);
            expect($(element, '[data-field="email"]')).not.toBeNull();
            expect($(element, 'h1').textContent).toBe('c.Donations_DataTitle');
            expect(element.shadowRoot.textContent).not.toContain('c.Donations_TypeTitle');
        });

        it('starts at step 2 with the amount chosen on the campaign page', async () => {
            mockLocation({ search: `?campana=${CAMPAIGN.id}&monto=750` });
            const element = await open();

            expect(currentStep(element)).toBe('2. c.Donations_StepData');
            expect($(element, '.side').textContent).toContain('$750 MXN');

            await click($(element, '.buttons-left .btn-secondary'));
            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(picker(element).querySelector('[data-id="custom-amount"]').value).toBe('750');
        });

        it('marks a suggested amount from the campaign page as chosen when going back', async () => {
            mockLocation({ search: `?campana=${CAMPAIGN.id}&monto=500` });
            const element = await open();
            await click($(element, '.buttons-left .btn-secondary'));

            expect(amounts(element)[2].getAttribute('aria-pressed')).toBe('true');
        });

        it('ignores an amount in the address that can not be donated and starts at step 1', async () => {
            for (const monto of ['5', 'abc', '1000000', '-20']) {
                cleanup();
                mockLocation({ search: `?campana=${CAMPAIGN.id}&monto=${monto}` });
                // eslint-disable-next-line no-await-in-loop
                const element = await open();
                expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
                expect(primaryButton(element).disabled).toBe(true);
            }
        });

        it('sends the amount chosen on the campaign page, centavos included', async () => {
            mockLocation({ search: `?campana=${CAMPAIGN.id}&monto=1250.5` });
            const element = await open();
            await chooseType(element, ANONYMOUS, NO_INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await next(element);

            expect(currentStep(element)).toBe('3. c.Donations_StepConfirm');
            await click(primaryButton(element));
            expect(startCheckout).toHaveBeenCalledWith(expect.objectContaining({ amount: 1250.5 }));
        });
    });

    // ---------- step 2: data, on the same page as the type ----------

    describe('step 2: data', () => {
        it('anonymous without invoice asks only for the email (US-02 AC5, AC6)', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, NO_INVOICE);

            expect($(element, '[data-field="email"]')).not.toBeNull();
            expect($(element, '[data-field="publicName"]')).toBeNull();
            expect($(element, 'input[name="person-type"]')).toBeNull();
            expect($(element, '[data-field="rfc"]')).toBeNull();
            expect(element.shadowRoot.textContent).toContain('c.Donations_EmailNote');

            await next(element);
            expect(errors(element)).toEqual(['c.Donations_ErrRequired']);
            expect($(element, '.alert').textContent).toBe('c.Donations_ErrFixFields');
            expect(currentStep(element)).toBe('2. c.Donations_StepData');
        });

        it('rejects an email without a valid format (US-03 AC6)', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, NO_INVOICE);
            await type(element, 'email', 'ana@dominio');
            await next(element);

            expect(errors(element)).toEqual(['c.Donations_ErrEmail']);
            expect($(element, '[data-field="email"]').getAttribute('aria-invalid')).toBe('true');
        });

        it('credited asks for the public name and the donor name (US-05 AC3)', async () => {
            const element = await open();
            await toData(element, 0, CREDITED, NO_INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await next(element);

            expect(errors(element)).toEqual(['c.Donations_ErrRequired', 'c.Donations_ErrRequired']);
            await choosePerson(element, 'Individual');
            expect($(element, '[data-field="firstName"]')).not.toBeNull();
            expect($(element, '[data-field="rfc"]')).toBeNull();
        });

        it('suggests the public name from the donor name without overwriting it', async () => {
            const element = await open();
            await toData(element, 0, CREDITED, NO_INVOICE);
            await choosePerson(element, 'Individual');
            await type(element, 'firstName', ' Ana ');
            await type(element, 'lastName', 'López');
            await blur(element, 'lastName');
            expect($(element, '[data-field="publicName"]').value).toBe('Ana López');

            await type(element, 'publicName', 'Familia López');
            await blur(element, 'firstName');
            expect($(element, '[data-field="publicName"]').value).toBe('Familia López');
        });

        it('suggests the company as public name', async () => {
            const element = await open();
            await toData(element, 0, CREDITED, NO_INVOICE);
            await choosePerson(element, 'Company');
            await type(element, 'company', 'Software del Sureste');
            await blur(element, 'company');

            expect($(element, '[data-field="publicName"]').value).toBe('Software del Sureste');
        });

        it('invoice asks for person type, RFC and consent (US-06 AC1, AC4, AC6)', async () => {
            const element = await open();
            await toData(element, 0, CREDITED, INVOICE);
            await next(element);

            expect(errors(element)).toEqual([
                'c.Donations_ErrRequired', // email
                'c.Donations_ErrRequired', // person type
                'c.Donations_ErrRequired', // public name
                'c.Donations_ErrRequired', // RFC
                'c.Donations_ErrConsent'
            ]);
        });

        it('checks the RFC length against the person type (US-06 AC5)', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await choosePerson(element, 'Company');
            await type(element, 'company', 'Software del Sureste');
            await type(element, 'rfc', 'gode 561231gr8');
            await tickConsent(element);
            await next(element);

            expect($(element, '[data-field="rfc"]').value).toBe('GODE561231GR8');
            expect(errors(element)).toEqual(['c.Donations_ErrRfcLengthCompany']);
        });

        it('anonymous with invoice asks for the name only for the invoice (US-02 AC3)', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, INVOICE);
            await choosePerson(element, 'Individual');

            expect($(element, '[data-field="publicName"]')).toBeNull();
            expect($(element, '[data-field="firstName"]')).not.toBeNull();
            expect(element.shadowRoot.textContent).toContain('c.Donations_NameNoteInvoice');
        });

        it('moves focus to the first invalid field', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, NO_INVOICE);
            const focus = jest.spyOn(HTMLElement.prototype, 'focus');
            await next(element);
            expect(focus).toHaveBeenCalledTimes(1);
            expect(focus.mock.contexts[0]).toBe($(element, '[data-field="email"]'));

            // A second try with the errors already on screen focuses right away.
            await next(element);
            expect(focus).toHaveBeenCalledTimes(2);
            focus.mockRestore();
        });

        it('stops asking for the consent once ticked', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, INVOICE);
            await next(element);
            expect(errors(element)).toContain('c.Donations_ErrConsent');

            await tickConsent(element);
            expect(errors(element)).not.toContain('c.Donations_ErrConsent');
        });
    });

    // ---------- step 3 ----------

    describe('step 3: confirmation and payment', () => {
        async function toConfirmation(element, amountIndex = 3) {
            await toData(element, amountIndex, ANONYMOUS, INVOICE);
            await type(element, 'email', ' ana@dominio.com ');
            await choosePerson(element, 'Company');
            await type(element, 'company', 'Software del Sureste');
            await type(element, 'rfc', 'ABC010101AB1');
            await tickConsent(element);
            await next(element);
        }

        it('summarizes the donation and highlights $1,000 or more (US-01 AC8)', async () => {
            const element = await open();
            await toConfirmation(element, 3);

            expect(currentStep(element)).toBe('3. c.Donations_StepConfirm');
            expect($(element, '.summary-big dd').textContent).toBe('$1,000 MXN');
            const values = $$(element, '.summary dd').map((node) => node.textContent);
            expect(values).toEqual([
                CAMPAIGN.name,
                '$1,000 MXN',
                'c.Donations_SummaryListAnonymous',
                'c.Donations_Yes',
                'Software del Sureste',
                'ana@dominio.com'
            ]);
        });

        it('does not highlight amounts under $1,000', async () => {
            const element = await open();
            await toConfirmation(element, 2);

            expect($(element, '.summary-big')).toBeNull();
        });

        it('lets the donor change the amount without opening the gateway (US-01 AC9)', async () => {
            const element = await open();
            await toConfirmation(element);
            await click($$(element, '.buttons-left .btn-secondary')[0]);

            expect(currentStep(element)).toBe('1. c.Donations_StepAmount');
            expect(startCheckout).not.toHaveBeenCalled();
            expect(location.assign).not.toHaveBeenCalled();
        });

        it('lets the donor change the data', async () => {
            const element = await open();
            await toConfirmation(element);
            await click($$(element, '.buttons-left .btn-secondary')[1]);

            expect(currentStep(element)).toBe('2. c.Donations_StepData');
            expect($(element, '[data-field="company"]').value).toBe('Software del Sureste');
        });

        it('sends only what the donation needs and opens Stripe (US-03 AC1, AC3)', async () => {
            const element = await open();
            await toConfirmation(element);
            await click(primaryButton(element));

            expect(startCheckout).toHaveBeenCalledTimes(1);
            expect(startCheckout).toHaveBeenCalledWith({
                    campaignId: CAMPAIGN.id,
                    amount: 1000,
                    email: 'ana@dominio.com',
                    anonymous: true,
                    publicName: null,
                    invoice: true,
                    personType: 'Company',
                    firstName: null,
                    lastName: null,
                    company: 'Software del Sureste',
                    rfc: 'ABC010101AB1',
                    invoiceConsent: true
            });
            expect(location.assign).toHaveBeenCalledWith(CHECKOUT_URL);
        });

        it('sends a credited donation without invoice data', async () => {
            const element = await open();
            await toData(element, 0, CREDITED, NO_INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await choosePerson(element, 'Individual');
            await type(element, 'firstName', 'Ana');
            await type(element, 'lastName', 'López');
            await type(element, 'publicName', 'Familia López');
            await next(element);
            await click(primaryButton(element));

            expect(startCheckout.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    amount: 100,
                    anonymous: false,
                    publicName: 'Familia López',
                    invoice: false,
                    personType: 'Individual',
                    firstName: 'Ana',
                    lastName: 'López',
                    company: null,
                    rfc: null,
                    invoiceConsent: false
                })
            );
        });

        it('sends an anonymous donation without any name', async () => {
            const element = await open();
            await toData(element, 0, ANONYMOUS, NO_INVOICE);
            await type(element, 'email', 'ana@dominio.com');
            await next(element);
            await click(primaryButton(element));

            expect(startCheckout.mock.calls[0][0]).toEqual(
                expect.objectContaining({
                    anonymous: true,
                    publicName: null,
                    personType: null,
                    firstName: null,
                    lastName: null,
                    company: null,
                    rfc: null
                })
            );
        });

        it('disables the button while processing so it is not sent twice', async () => {
            let resolve;
            startCheckout.mockReturnValue(
                new Promise((done) => {
                    resolve = done;
                })
            );
            const element = await open();
            await toConfirmation(element);
            const pay = primaryButton(element);
            await click(pay);
            await click(pay);

            expect(pay.disabled).toBe(true);
            expect(pay.textContent.trim()).toBe('c.Donations_Processing');
            expect(startCheckout).toHaveBeenCalledTimes(1);
            resolve(CHECKOUT_URL);
            await flushPromises();
            expect(location.assign).toHaveBeenCalledTimes(1);
        });

        it('stays on the page with the server message if the donation fails (US-03 AC4)', async () => {
            startCheckout.mockRejectedValue({ body: { message: 'La campaña ya no recibe donaciones.' } });
            const element = await open();
            await toConfirmation(element);
            await click(primaryButton(element));
            await flushPromises();

            expect($(element, '[role="alert"]').textContent).toBe('La campaña ya no recibe donaciones.');
            expect(primaryButton(element).disabled).toBe(false);
            expect(location.assign).not.toHaveBeenCalled();
        });

        it('shows a generic message when the failure has no message', async () => {
            startCheckout.mockResolvedValue(null);
            const element = await open();
            await toConfirmation(element);
            await click(primaryButton(element));
            await flushPromises();

            expect($(element, '[role="alert"]').textContent).toBe('c.Donations_SubmitError');
            expect(location.assign).not.toHaveBeenCalled();
        });
    });
});
