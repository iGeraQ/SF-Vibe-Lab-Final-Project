import StaffProgressBar from 'c/staffProgressBar';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

describe('c-staff-progress-bar', () => {
    afterEach(cleanup);

    it('fills the bar and reports the real percentage over 100 (US-08 AC5)', async () => {
        const element = mount('c-staff-progress-bar', StaffProgressBar, { percent: 118, label: 'Avance de X' });
        await flushPromises();
        const track = $(element, '[role="progressbar"]');
        expect(track.getAttribute('aria-valuenow')).toBe('118');
        expect(track.getAttribute('aria-valuemax')).toBe('118');
        expect(track.getAttribute('aria-label')).toBe('Avance de X');
        expect($(element, '.bar').style.width).toBe('100%');
    });

    it('handles partial, empty and invalid values', async () => {
        const element = mount('c-staff-progress-bar', StaffProgressBar, { percent: 12 });
        await flushPromises();
        expect($(element, '.bar').style.width).toBe('12%');
        expect($(element, '[role="progressbar"]').getAttribute('aria-valuemax')).toBe('100');

        element.percent = 'abc';
        await flushPromises();
        expect($(element, '.bar').style.width).toBe('0%');
    });

    it('supports the large and muted variants', async () => {
        const element = mount('c-staff-progress-bar', StaffProgressBar, { percent: 50, large: true, muted: true });
        await flushPromises();
        expect($(element, '.track').classList).toContain('track-large');
        expect($(element, '.bar').classList).toContain('bar-muted');
    });
});
