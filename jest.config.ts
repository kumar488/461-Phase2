import { Config } from 'jest';
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageReporters: ["json-summary", "text", "lcov"],
    testMatch: ["**/__apitests__/**/*.test.ts", "**/__tests__/**/*.test.ts"],
}

export default config;