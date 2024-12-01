import { addPackage, deletePackage, updatePackage, getPackageByID, resetTable, initializeTables } from './packagedb';
import { createConnection } from './packagedb';
import { PackageData } from './packagedb';

const testPackage: PackageData = {
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

async function testDatabaseFunctions() {
    // Initialize the database and tables
    await initializeTables();

    const updatedPackageData: Partial<PackageData> = {
        Version: '1.1.0', // Updating just the version
        NET_SCORE: 0.9,
    };

    try {
        // Test addPackage function
        console.log('Adding package...');
        const result = await addPackage(testPackage);
        const packageId = result.id;
        console.log(`Package added with ID: ${packageId}`);

        // Test getPackageByID function
        console.log('Retrieving package...');
        const packageData = await getPackageByID(packageId);
        if (!packageData || packageData[0].Name !== 'TestPackage') {
            throw new Error(`Failed to retrieve package correctly, got: ${JSON.stringify(packageData)}`);
        }
        console.log('Package retrieved successfully:', packageData[0]);

        // Test updatePackage function with partial update
        console.log('Updating package...');
        await updatePackage(packageId, updatedPackageData);

        // Confirm update
        const updatedPackage = await getPackageByID(packageId);
        if (!updatedPackage || updatedPackage[0].Version !== '1.1.0') {
            throw new Error(`Failed to update package version, got: ${updatedPackage?.[0]?.Version}`);
        }
        if (updatedPackage[0].NET_SCORE !== undefined && parseFloat(updatedPackage[0].NET_SCORE.toFixed(3)) !== 0.9) {
            throw new Error(`Failed to update NET_SCORE, got: ${updatedPackage[0].NET_SCORE}`);
        }
        console.log('Package updated successfully:', updatedPackage[0]);

        // Test deletePackage function
        console.log('Deleting package...');
        await deletePackage(packageId);

        // Attempt to retrieve deleted package (expect null or empty result)
        const deletedPackage = await getPackageByID(packageId);
        if (deletedPackage && deletedPackage.length > 0) {
            throw new Error('Package was not deleted successfully');
        }
        console.log('Package deleted successfully.');

        // Test resetTable function
        console.log('Resetting table...');
        await resetTable();

        // Ensure table is empty after reset
        const connection = await createConnection();
        const [rows] = await connection.query(`SELECT * FROM packages`);
        if (Array.isArray(rows) && rows.length !== 0) {
            throw new Error('Table was not reset successfully');
        }
        await connection.end();
        console.log('Table reset successfully.');

        // Error testing cases
        console.log('Testing error cases...');

        // Case 1: Adding a package without required fields
        try {
            await addPackage({} as PackageData);
            console.error('Expected error but none was thrown');
        } catch (error: any) {
            console.log('Expected error for missing fields in addPackage:', error.message);
        }

        // Case 2: Updating a non-existent package
        try {
            await updatePackage(99999, { Version: '2.0.0' });
            console.error('Expected error but none was thrown');
        } catch (error: any) {
            console.log('Expected error for updating non-existent package:', error.message);
        }

        // Case 3: Deleting a non-existent package
        try {
            await deletePackage(99999);
            console.error('Expected error but none was thrown');
        } catch (error: any) {
            console.log('Expected error for deleting non-existent package:', error.message);
        }

        console.log('All tests completed successfully.');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testDatabaseFunctions();
