const lwc = require('@salesforce/eslint-config-lwc/recommended');
const jest = require('eslint-plugin-jest');

module.exports = [
    ...lwc,
    {
        files: ['**/__tests__/**/*.js'],
        ...jest.configs['flat/recommended'],
        languageOptions: { globals: { ...jest.environments.globals.globals, require: 'readonly' } }
    },
    { ignores: ['node_modules/**', 'coverage/**', 'jest-mocks/**'] }
];
