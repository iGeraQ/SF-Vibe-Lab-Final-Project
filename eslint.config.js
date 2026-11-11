const lwc = require('@salesforce/eslint-config-lwc/recommended');
const jest = require('eslint-plugin-jest');

module.exports = [
    ...lwc,
    {
        files: ['**/__tests__/**/*.js'],
        ...jest.configs['flat/recommended'],
        languageOptions: { globals: { ...jest.environments.globals.globals, require: 'readonly' } }
    },
    {
        // Tests emit data through the wire adapters' test API, which the rule doesn't know about.
        files: ['**/__tests__/**/*.js'],
        rules: { '@lwc/lwc/no-unexpected-wire-adapter-usages': 'off' }
    },
    { ignores: ['node_modules/**', 'coverage/**', 'jest-mocks/**'] }
];
