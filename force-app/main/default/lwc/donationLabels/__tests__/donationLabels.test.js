import { LABELS, format } from 'c/donationLabels';

describe('c-donation-labels', () => {
    it('exposes every label of the site', () => {
        expect(Object.keys(LABELS).length).toBeGreaterThan(100);
        expect(LABELS.thanksTitle).toBe('c.Donations_ThanksTitle');
    });

    it('replaces placeholders in order', () => {
        expect(format('Cierra el {0}', '20 de noviembre')).toBe('Cierra el 20 de noviembre');
        expect(format('{0} de {1}', 'A', 'B')).toBe('A de B');
    });

    it('leaves a label without placeholders as is', () => {
        expect(format('Donar')).toBe('Donar');
    });
});
