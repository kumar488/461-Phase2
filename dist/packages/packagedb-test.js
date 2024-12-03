"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const packagedb_1 = require("./packagedb");
const packagedb_2 = require("./packagedb");
const testPackage = {
    Name: 'TestPackage',
    Version: '1.0.0',
    URL: 'https://example.com',
    Content: 'Test content',
    JSProgram: 'console.log("Hello World");',
    NET_SCORE: 0.8,
    RAMP_UP_SCORE: 0.9,
    CORRECTNESS_SCORE: 1.0,
    BUS_FACTOR_SCORE: 0.7,
    RESPONSIVE_MAINTAINER_SCORE: 0.85,
    LICENSE_SCORE: 100,
    PINNED_PRACTICE_SCORE: 0.5,
    PULL_REQUEST_RATING_SCORE: 0.75,
};
function testDatabaseFunctions() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Initialize the database and tables
        yield (0, packagedb_1.initializeTables)();
        const updatedPackageData = {
            Version: '1.1.0', // Updating just the version
            NET_SCORE: 0.9,
        };
        try {
            // Test addPackage function
            console.log('Adding package...');
            const result = yield (0, packagedb_1.addPackage)(testPackage);
            const packageId = result.id;
            console.log(`Package added with ID: ${packageId}`);
            // Test getPackageByID function
            console.log('Retrieving package...');
            const packageData = yield (0, packagedb_1.getPackageByID)(packageId);
            if (!packageData || packageData[0].Name !== 'TestPackage') {
                throw new Error(`Failed to retrieve package correctly, got: ${JSON.stringify(packageData)}`);
            }
            console.log('Package retrieved successfully:', packageData[0]);
            // Test updatePackage function with partial update
            console.log('Updating package...');
            yield (0, packagedb_1.updatePackage)(packageId, updatedPackageData);
            // Confirm update
            const updatedPackage = yield (0, packagedb_1.getPackageByID)(packageId);
            if (!updatedPackage || updatedPackage[0].Version !== '1.1.0') {
                throw new Error(`Failed to update package version, got: ${(_a = updatedPackage === null || updatedPackage === void 0 ? void 0 : updatedPackage[0]) === null || _a === void 0 ? void 0 : _a.Version}`);
            }
            if (updatedPackage[0].NET_SCORE !== undefined && parseFloat(updatedPackage[0].NET_SCORE.toFixed(3)) !== 0.9) {
                throw new Error(`Failed to update NET_SCORE, got: ${updatedPackage[0].NET_SCORE}`);
            }
            console.log('Package updated successfully:', updatedPackage[0]);
            // Test deletePackage function
            console.log('Deleting package...');
            yield (0, packagedb_1.deletePackage)(packageId);
            // Attempt to retrieve deleted package (expect null or empty result)
            const deletedPackage = yield (0, packagedb_1.getPackageByID)(packageId);
            if (deletedPackage && deletedPackage.length > 0) {
                throw new Error('Package was not deleted successfully');
            }
            console.log('Package deleted successfully.');
            // Test resetTable function
            console.log('Resetting table...');
            yield (0, packagedb_1.resetTable)();
            // Ensure table is empty after reset
            const connection = yield (0, packagedb_2.createConnection)();
            const [rows] = yield connection.query(`SELECT * FROM packages`);
            if (Array.isArray(rows) && rows.length !== 0) {
                throw new Error('Table was not reset successfully');
            }
            yield connection.end();
            console.log('Table reset successfully.');
            // Error testing cases
            console.log('Testing error cases...');
            // Case 1: Adding a package without required fields
            try {
                yield (0, packagedb_1.addPackage)({});
                console.error('Expected error but none was thrown');
            }
            catch (error) {
                console.log('Expected error for missing fields in addPackage:', error.message);
            }
            // Case 2: Updating a non-existent package
            try {
                yield (0, packagedb_1.updatePackage)(99999, { Version: '2.0.0' });
                console.error('Expected error but none was thrown');
            }
            catch (error) {
                console.log('Expected error for updating non-existent package:', error.message);
            }
            // Case 3: Deleting a non-existent package
            try {
                yield (0, packagedb_1.deletePackage)(99999);
                console.error('Expected error but none was thrown');
            }
            catch (error) {
                console.log('Expected error for deleting non-existent package:', error.message);
            }
            console.log('All tests completed successfully.');
        }
        catch (err) {
            console.error('Test failed:', err);
        }
    });
}
testDatabaseFunctions();
//# sourceMappingURL=packagedb-test.js.map