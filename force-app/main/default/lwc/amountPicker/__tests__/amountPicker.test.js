import AmountPicker from 'c/amountPicker';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

describe('c-amount-picker', () => {
    afterEach(cleanup);

    const input = (element) => $(element, '[data-id="custom-amount"]');
    const pressed = (element) => $$(element, '.amount').map((node) => node.getAttribute('aria-pressed'));

    async function typeAmount(element, value) {
        input(element).value = value;
        input(element).dispatchEvent(new CustomEvent('input'));
        await flushPromises();
    }

    async function choose(element, index) {
        $$(element, '.amount')[index].click();
        await flushPromises();
    }

    function listen(element) {
        const handler = jest.fn();
        element.addEventListener('amountchange', handler);
        return () => handler.mock.calls.map(([event]) => event.detail);
    }

    it('offers the eight suggested amounts and an always visible "Otro monto" field (US-01 AC7, US-13)', async () => {
        const element = mount('c-amount-picker', AmountPicker);
        await flushPromises();

        expect($$(element, '.amount').map((node) => node.textContent)).toEqual([
            '$100MXN',
            '$250MXN',
            '$500MXN',
            '$1,000MXN',
            '$2,000MXN',
            '$5,000MXN',
            '$10,000MXN',
            '$20,000MXN'
        ]);
        expect($(element, '.field-label').textContent).toBe('c.Donations_AmountOther');
        expect(input(element)).not.toBeNull();
        expect($(element, '.amounts-compact')).toBeNull();
    });

    it('shows four larger amounts in compact mode, for the campaign page', async () => {
        const element = mount('c-amount-picker', AmountPicker, { compact: true });
        await flushPromises();

        expect($(element, '.amounts-compact')).not.toBeNull();
        expect($$(element, '.amount').map((node) => node.textContent)).toEqual(['$1,000MXN', '$5,000MXN', '$10,000MXN', '$20,000MXN']);
        expect(input(element)).not.toBeNull();
    });

    it('keeps only one amount chosen and tells the parent', async () => {
        const element = mount('c-amount-picker', AmountPicker);
        const details = listen(element);
        await flushPromises();

        await choose(element, 1);
        await typeAmount(element, '5');
        expect(pressed(element)[1]).toBe('false');
        expect(input(element).className).toContain('custom-on');

        await typeAmount(element, '80.25');
        await choose(element, 3);
        expect(input(element).value).toBe('');
        expect(pressed(element)[3]).toBe('true');

        await typeAmount(element, '60');
        await typeAmount(element, '');

        expect(details()).toEqual([
            { amount: 250, custom: false },
            { amount: null, custom: true },
            { amount: 80.25, custom: true },
            { amount: 1000, custom: false },
            { amount: 60, custom: true },
            { amount: null, custom: false }
        ]);
    });

    it('validates before the parent moves on and shows why a typed amount is not valid', async () => {
        const element = mount('c-amount-picker', AmountPicker);
        await flushPromises();
        expect(element.validate()).toBe(false);
        expect($(element, '.field-error')).toBeNull();

        await typeAmount(element, '1000000');
        const focus = jest.spyOn(HTMLElement.prototype, 'focus');
        expect(element.validate()).toBe(false);
        await flushPromises();

        expect($(element, '.field-error').textContent).toBe('c.Donations_ErrAmountMax');
        expect(input(element).getAttribute('aria-invalid')).toBe('true');
        expect(focus.mock.contexts).toContain(input(element));
        focus.mockRestore();

        await typeAmount(element, '1500');
        expect(element.validate()).toBe(true);
    });

    it('drops anything that is not part of a positive amount as it is typed or pasted', async () => {
        const element = mount('c-amount-picker', AmountPicker);
        await flushPromises();
        const changes = listen(element);

        await typeAmount(element, '-$1,500.509abc');
        expect(input(element).value).toBe('1500.50');
        expect(changes().at(-1)).toEqual({ amount: 1500.5, custom: true });

        await typeAmount(element, 'e');
        expect(input(element).value).toBe('');
        expect(changes().at(-1)).toEqual({ amount: null, custom: false });
    });

    it('waits until the donor leaves the field to show an error, and clears it when the field is emptied', async () => {
        const element = mount('c-amount-picker', AmountPicker);
        await flushPromises();

        await typeAmount(element, '3');
        expect($(element, '.field-error')).toBeNull();
        input(element).dispatchEvent(new CustomEvent('blur'));
        await flushPromises();
        expect($(element, '.field-error').textContent).toBe('c.Donations_ErrAmountMin');

        await typeAmount(element, '');
        input(element).dispatchEvent(new CustomEvent('blur'));
        await flushPromises();
        expect($(element, '.field-error')).toBeNull();
    });

    it('shows a given suggested amount as chosen', async () => {
        const element = mount('c-amount-picker', AmountPicker, { value: 2000 });
        await flushPromises();

        expect(pressed(element)[4]).toBe('true');
        expect(input(element).value).toBe('');
        expect(element.validate()).toBe(true);
    });

    it('shows any other given amount in the field', async () => {
        const element = mount('c-amount-picker', AmountPicker, { value: 333.5 });
        await flushPromises();

        expect(pressed(element)).not.toContain('true');
        expect(input(element).value).toBe('333.5');
    });

    it('ignores an empty or invalid given amount', async () => {
        const element = mount('c-amount-picker', AmountPicker, { value: 'abc' });
        await flushPromises();

        expect(pressed(element)).not.toContain('true');
        expect(element.value).toBeNull();
    });
});
