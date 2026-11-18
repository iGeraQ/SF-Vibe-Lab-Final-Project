import LABELS, { format } from 'c/staffLabels';

describe('c/staffLabels', () => {
    it('exposes the staff labels', () => {
        expect(LABELS.campaignsTitle).toBe('c.Staff_CampaignsTitle');
        expect(Object.isFrozen(LABELS)).toBe(true);
    });

    it('fills in the placeholders', () => {
        expect(format('Avance de {0}', 'Transporte')).toBe('Avance de Transporte');
        expect(format('{0} y {1} y {0}', 'a', 'b')).toBe('a y b y a');
        expect(format(undefined, 'x')).toBe('');
    });
});
