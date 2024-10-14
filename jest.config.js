module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    "src/*.ts",
    "!src/coverageReport.ts",
  ],
  testMatch: ["**/__tests__/**/*.test.ts"],
  coverageDirectory: "coverage",
  coverageReporters: ["json-summary", "text", "lcov"],
};
