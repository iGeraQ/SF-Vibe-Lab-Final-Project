/**
 * lightning/navigation for Jest: same API as the sfdx-lwc-jest stub, but every Navigate call is
 * recorded in navigate.mock.calls so tests can check where a component sends the user.
 */
import { createTestWireAdapter } from '@salesforce/wire-service-jest-util';

export const CurrentPageReference = createTestWireAdapter(jest.fn());
export const navigate = jest.fn();

const Navigate = Symbol('Navigate');
const GenerateUrl = Symbol('GenerateUrl');

export const NavigationMixin = (Base) =>
    class extends Base {
        [Navigate](pageReference, replace) {
            navigate(pageReference, replace);
        }

        [GenerateUrl]() {
            return Promise.resolve('https://www.example.com');
        }
    };
NavigationMixin.Navigate = Navigate;
NavigationMixin.GenerateUrl = GenerateUrl;
