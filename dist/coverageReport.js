"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Function to read JSON files
function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}
// Correct the path to the coverage directory at the root level
const coveragePath = path.join(__dirname, '../coverage', 'coverage-summary.json');
const testResultsPath = path.join(__dirname, '../coverage', 'testResults.json');
// Read the coverage summary and test results
const coverageSummary = readJSON(coveragePath);
const testResults = readJSON(testResultsPath);
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
//# sourceMappingURL=coverageReport.js.map