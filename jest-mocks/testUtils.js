/**
 * Helpers shared by the LWC tests. Imported as 'test-utils' (see jest.config.js).
 */
import { createElement } from 'lwc';

/** Two active campaigns as PublicCampaignController returns them. */
export const CAMPAIGNS = [
    {
        id: '701000000000001AAA',
        name: 'Transporte y hospedaje',
        description: 'Autobús y hospedaje para el grupo.',
        imageUrl: null,
        purpose: 'Autobús redondo y dos noches de hospedaje.',
        endDate: '2026-11-19',
        goal: 1000,
        raised: 1250,
        progress: 125
    },
    {
        id: '701000000000002AAA',
        name: 'Campaña general',
        description: 'Siempre abierta.',
        imageUrl: 'https://images.example.com/general.png',
        purpose: 'Lo que más falte del viaje.',
        endDate: '2099-12-31',
        goal: 50000,
        raised: 0,
        progress: 0
    }
];

/** Waits for pending promises and re-renders. */
export function flushPromises() {
    // eslint-disable-next-line @lwc/lwc/no-async-operation
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Replaces window.location with a fake one, so tests can set the query string and check navigation.
 * @param {Object} [values] search, pathname or hostname
 * @returns {{replace: jest.Mock, assign: jest.Mock}} the navigation spies
 */
export function mockLocation(values = {}) {
    const location = {
        href: 'https://donaciones.example.com/s/',
        hostname: 'donaciones.example.com',
        pathname: '/s/',
        search: '',
        ...values,
        replace: jest.fn(),
        assign: jest.fn()
    };
    Object.defineProperty(window, 'location', { value: location, writable: true, configurable: true });
    return location;
}

/**
 * Creates a component and adds it to the page.
 * @param {string} tag the element name, e.g. c-campaign-list
 * @param {Function} ctor the component class
 * @param {Object} [props] public properties
 * @returns {HTMLElement} the element
 */
export function mount(tag, ctor, props = {}) {
    const element = createElement(tag, { is: ctor });
    Object.assign(element, props);
    document.body.appendChild(element);
    return element;
}

/** Removes every component from the page. */
export function cleanup() {
    while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
    }
}

/** querySelector inside a component's shadow root. */
export function $(element, selector) {
    return element.shadowRoot.querySelector(selector);
}

/** querySelectorAll inside a component's shadow root, as an array. */
export function $$(element, selector) {
    return Array.from(element.shadowRoot.querySelectorAll(selector));
}
