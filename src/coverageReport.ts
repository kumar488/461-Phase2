import * as fs from 'fs';
import * as path from 'path';

interface CoverageSummary {
  total: {
    lines: {
      total: number;
      covered: number;
    };
  };
}

interface TestResults {
  testResults: Array<{
    numPassingTests: number;
    numFailingTests: number;
    testFilePath: string;
  }>;
  numTotalTests: number;
  numPassedTests: number;
  numTotalTestSuites: number;
  numPassedTestSuites: number;
}

// Function to read JSON files
function readJSON<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Correct the path to the coverage directory at the root level
const coveragePath = path.join(__dirname, '../coverage', 'coverage-summary.json');
const testResultsPath = path.join(__dirname, '../coverage', 'testResults.json');

// Read the coverage summary and test results
const coverageSummary: CoverageSummary = readJSON<CoverageSummary>(coveragePath);
const testResults: TestResults = readJSON<TestResults>(testResultsPath);

// Calculate coverage percentage
const totalLines = coverageSummary.total.lines.total;
const coveredLines = coverageSummary.total.lines.covered;

const coveragePercent = ((coveredLines / totalLines) * 100).toFixed(0);


// Get the total and passed test cases
const totalTests = testResults.numTotalTests;
const passedTests = testResults.numPassedTests;

// Get the total and passed test suites
const totalTestSuites = testResults.testResults.length;
const passedTestSuites = testResults.testResults.filter(suite => suite.numFailingTests === 0).length;

// Output the formatted result
console.log(`Total: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Coverage: ${coveragePercent}%`);
console.log(`${passedTests}/${totalTests} test cases passed. ${coveragePercent}% line coverage achieved.`);
