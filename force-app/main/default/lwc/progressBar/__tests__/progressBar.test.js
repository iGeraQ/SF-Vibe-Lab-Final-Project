import ProgressBar from 'c/progressBar';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

describe('c-progress-bar', () => {
    afterEach(cleanup);

    async function render(props) {
        const element = mount('c-progress-bar', ProgressBar, props);
        await flushPromises();
        return { track: $(element, '[role="progressbar"]'), bar: $(element, '.bar'), element };
    }

    it('fills the bar to the percentage and names it for screen readers', async () => {
        const { track, bar } = await render({ percent: 46, label: 'Avance de Boletos' });

        expect(bar.style.width).toBe('46%');
        expect(track.getAttribute('aria-label')).toBe('Avance de Boletos');
        expect(track.getAttribute('aria-valuenow')).toBe('46');
        expect(track.getAttribute('aria-valuemin')).toBe('0');
        expect(track.getAttribute('aria-valuemax')).toBe('100');
    });

    it('keeps the bar full over 100% but reports the real value (US-08 AC5)', async () => {
        const { track, bar } = await render({ percent: 125 });

        expect(bar.style.width).toBe('100%');
        expect(track.getAttribute('aria-valuenow')).toBe('125');
        expect(track.getAttribute('aria-valuemax')).toBe('125');
    });

    it('treats empty or negative values as zero', async () => {
        const { track, bar } = await render({ percent: -5 });
        expect(bar.style.width).toBe('0%');
        expect(track.getAttribute('aria-valuenow')).toBe('0');

        const empty = await render({ percent: null });
        expect(empty.bar.style.width).toBe('0%');
    });

    it('updates the width when the percentage changes', async () => {
        const { element } = await render({ percent: 10 });
        element.percent = 80;
        await flushPromises();

        expect($(element, '.bar').style.width).toBe('80%');
    });

    it('supports the three sizes and the grey bar of finished campaigns', async () => {
        expect((await render({ size: 'small' })).track.className).toBe('track track-small');
        expect((await render({ size: 'large' })).track.className).toBe('track track-large');
        expect((await render({ size: 'huge' })).track.className).toBe('track track-medium');
        expect((await render({ muted: true })).bar.className).toBe('bar bar-muted');
        expect((await render({})).bar.className).toBe('bar');
    });
});
