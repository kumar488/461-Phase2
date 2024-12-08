import { Config } from 'jest';
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    collectCoverage: true,
    collectCoverageFrom: [
        "src/routes/**/*.ts",
        "src/controllers/**/*.ts",
        "!src/routes/tracks.ts",
        "!src/controllers/tracksController.ts",
        "!src/routes/authenticate.ts",
        "!src/controllers/authenticateController.ts",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["json-summary", "text", "lcov"],
    testMatch: ["**/__apitests__/**/*.test.ts"],
}

export default config;