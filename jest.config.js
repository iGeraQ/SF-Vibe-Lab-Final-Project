const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
    ...jestConfig,
    moduleNameMapper: {
        // CSS-only module: the platform supports it, Jest needs the path.
        '^c/donationStyles$': '<rootDir>/force-app/main/default/lwc/donationStyles/donationStyles.css',
        '^c/staffStyles$': '<rootDir>/force-app/main/default/lwc/staffStyles/staffStyles.css',
        // Only exists inside an Experience Cloud site.
        '^@salesforce/community/basePath$': '<rootDir>/jest-mocks/basePath.js',
        // Shared helpers for the tests.
        '^test-utils$': '<rootDir>/jest-mocks/testUtils.js',
        '^staff-test-data$': '<rootDir>/jest-mocks/staffTestData.js',
        // Navigation mock that records each Navigate call, for the staff tests.
        '^lightning/navigation$': '<rootDir>/jest-mocks/navigation.js'
    },
    // v8 coverage: the default babel provider reports 0% with this Jest setup on Node 22+.
    coverageProvider: 'v8',
    collectCoverageFrom: ['force-app/main/default/lwc/**/*.js', '!**/__tests__/**'],
    coverageThreshold: {
        global: { statements: 90, branches: 80, functions: 90, lines: 90 }
    }
};
