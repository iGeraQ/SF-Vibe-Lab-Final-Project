import InfoTip from 'c/infoTip';
import { cleanup, flushPromises, mount, $, $$ } from 'test-utils';

const ITEMS = [
    { title: 'Sí', text: 'Tu nombre aparece en la lista.' },
    { title: 'No', text: 'Tu donación es anónima.' }
];

async function open(props) {
    const element = mount('c-info-tip', InfoTip, props);
    await flushPromises();
    return element;
}

const button = (element) => $(element, '.tip-button');
const bubble = (element) => $(element, '[role="tooltip"]');

describe('c-info-tip', () => {
    afterEach(cleanup);

    it('starts closed, with an accessible name and the text linked to the button', async () => {
        const element = await open({ text: 'Solo se usa para tu factura.' });

        expect(button(element).getAttribute('aria-label')).toBe('c.Donations_MoreInfo');
        expect(button(element).getAttribute('aria-expanded')).toBe('false');
        expect(button(element).getAttribute('aria-describedby')).toBe(bubble(element).id);
        expect(bubble(element).textContent).toBe('Solo se usa para tu factura.');
        expect(bubble(element).classList.contains('bubble-open')).toBe(false);
    });

    it('shows one line per answer when given items', async () => {
        const element = await open({ items: ITEMS });

        expect($$(element, '.tip-item').map((node) => node.textContent)).toEqual([
            'Sí: Tu nombre aparece en la lista.',
            'No: Tu donación es anónima.'
        ]);
    });

    it('opens on tap or focus and closes on Escape or blur', async () => {
        const element = await open({ text: 'Ayuda' });

        button(element).click();
        await flushPromises();
        expect(button(element).getAttribute('aria-expanded')).toBe('true');
        expect(bubble(element).classList.contains('bubble-open')).toBe(true);

        button(element).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-open')).toBe(false);

        button(element).dispatchEvent(new CustomEvent('focus'));
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-open')).toBe(true);

        button(element).dispatchEvent(new CustomEvent('blur'));
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-open')).toBe(false);
    });

    it('opens on hover and ignores other keys', async () => {
        const element = await open({ text: 'Ayuda' });

        $(element, '.tip').dispatchEvent(new CustomEvent('mouseenter'));
        await flushPromises();
        button(element).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-open')).toBe(true);

        $(element, '.tip').dispatchEvent(new CustomEvent('mouseleave'));
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-open')).toBe(false);
    });

    it('opens to the left when the button is on the right half of the screen', async () => {
        const element = await open({ text: 'Ayuda' });
        button(element).getBoundingClientRect = () => ({ left: window.innerWidth - 40 });

        button(element).click();
        await flushPromises();
        expect(bubble(element).classList.contains('bubble-right')).toBe(true);
    });
});
