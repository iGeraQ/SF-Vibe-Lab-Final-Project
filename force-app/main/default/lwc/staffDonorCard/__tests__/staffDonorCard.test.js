import StaffDonorCard from 'c/staffDonorCard';
import { getRecord, updateRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { recordOf } from 'staff-test-data';
import { cleanup, flushPromises, mount, $ } from 'test-utils';

const DONOR = { Donor_Email__c: 'h.ibarra@correo.example', Public_Name__c: 'Héctor Ibarra', Is_Anonymous__c: false };

function objectInfo(editable) {
    return { updateable: true, fields: { Public_Name__c: { updateable: editable } } };
}

async function render({ editable = false, donor = DONOR } = {}) {
    const element = mount('c-staff-donor-card', StaffDonorCard, { recordId: '006A' });
    getRecord.emit(recordOf(donor));
    getObjectInfo.emit(objectInfo(editable));
    await flushPromises();
    return element;
}

async function type(element, value) {
    const input = $(element, 'input');
    input.value = value;
    input.dispatchEvent(new CustomEvent('input'));
    await flushPromises();
}

describe('c-staff-donor-card', () => {
    afterEach(() => {
        cleanup();
        jest.clearAllMocks();
    });

    it('shows a loading state, then an error if the donation cannot be read', async () => {
        const element = mount('c-staff-donor-card', StaffDonorCard, { recordId: '006A' });
        await flushPromises();
        expect($(element, '.state').textContent).toBe('c.Staff_Loading');

        getRecord.error();
        await flushPromises();
        expect($(element, '[role="alert"]').textContent).toBe('c.Staff_LoadError');
    });

    it("shows the donor's email to every staff role (US-09 AC2)", async () => {
        const element = await render();
        expect($(element, '.email').textContent).toBe('h.ibarra@correo.example');
    });

    it('shows the public name read only to users who cannot edit it (US-09 AC4)', async () => {
        const element = await render({ editable: false });
        expect($(element, 'input')).toBeNull();
        expect($(element, '.public-name').textContent).toBe('Héctor Ibarra');
        expect($(element, '.locked-note').textContent).toBe('c.Staff_PublicNameLocked');
    });

    it('needs the object to be editable too', async () => {
        const element = mount('c-staff-donor-card', StaffDonorCard, { recordId: '006A' });
        getRecord.emit(recordOf(DONOR));
        getObjectInfo.emit({ updateable: false, fields: { Public_Name__c: { updateable: true } } });
        await flushPromises();
        expect($(element, 'input')).toBeNull();
    });

    it('lets the Moderator change the public name (US-09 AC4)', async () => {
        const element = await render({ editable: true });
        const save = $(element, '.save');
        expect($(element, 'input').value).toBe('Héctor Ibarra');
        expect(save.disabled).toBe(true);

        await type(element, '  Héctor I.  ');
        expect(save.disabled).toBe(false);
        save.click();
        await flushPromises();

        expect(updateRecord).toHaveBeenCalledWith({ fields: { Id: '006A', Public_Name__c: 'Héctor I.' } });
        expect($(element, '[role="status"]').textContent).toBe('c.Staff_Saved');
    });

    it('does not save an unchanged name', async () => {
        const element = await render({ editable: true });
        await type(element, 'Héctor Ibarra ');
        expect($(element, '.save').disabled).toBe(true);
        $(element, '.save').click();
        expect(updateRecord).not.toHaveBeenCalled();
    });

    it('shows the validation message if the save fails, and keeps the draft', async () => {
        updateRecord.mockRejectedValueOnce({
            body: { output: { fieldErrors: { Public_Name__c: [{ message: 'Escribe un nombre público.' }] } } }
        });
        const element = await render({ editable: true });
        await type(element, 'Otro nombre');
        $(element, '.save').click();
        await flushPromises();

        expect($(element, '.save-error').textContent).toBe('Escribe un nombre público.');
        expect($(element, 'input').value).toBe('Otro nombre');

        await type(element, 'Otro nombre 2');
        expect($(element, '.save-error')).toBeNull();
    });

    it('shows a generic message for unexpected errors', async () => {
        updateRecord.mockRejectedValueOnce(new Error('boom'));
        const element = await render({ editable: true });
        await type(element, 'Nuevo');
        $(element, '.save').click();
        await flushPromises();
        expect($(element, '.save-error').textContent).toBe('c.Staff_SaveError');
    });

    it('notes when the donation is anonymous and handles missing values', async () => {
        const element = await render({ donor: { Donor_Email__c: null, Public_Name__c: null, Is_Anonymous__c: true } });
        expect($(element, '.anonymous').textContent).toBe('c.Staff_AnonymousNote');
        expect($(element, '.email').textContent).toBe('c.Staff_NoValue');
        expect($(element, '.public-name').textContent).toBe('c.Staff_NoValue');
    });
});
