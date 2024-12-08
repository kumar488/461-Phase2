// import { Request, Response } from 'express';
// import mysql from 'mysql2/promise';
// import pool from '../src/sqlhelper';
// import getPackageRate from '../src/controllers/packageController';
import request from 'supertest';
import app from '../src/app';
// import { getPackageByID } from '../src/packages/packagedb';

// let connection: mysql.Connection;

// beforeAll(async () => {
//     // Initialize the connection
//     connection = await mysql.createConnection({
//         host: process.env.DB_HOST,
//         user: process.env.DB_USER,
//         password: process.env.DB_PASSWORD,
//         database: process.env.DB_NAME,
//     });
// });

// afterAll(async () => {
//     // Close the connection
//     if (connection) {
//         await connection.end();
//     }
// });

jest.setTimeout(80000); // Set timeout to 30 seconds

// jest.mock('../src/packages/packagedb', () => ({
//     getPackageByID: jest.fn(),
// }));

jest.mock('../src/sqlhelper', () => ({
    query: jest.fn().mockResolvedValueOnce([ // Mock SQL queries
        [{ id: 6, name: 'express', version: '5.0.1' }]
    ]),
}));
//write a mock for src/packages/packagedb.ts for addPackage
// jest.mock('../src/packages/packagedb', () => ({
//     addPackage: jest.fn().mockResolvedValueOnce({
//         id: 1, name: 'test-package'
//     }),
// }));

// jest.mock('../src/controllers/packageController', () => ({
//     createPackage: jest.fn(),
//     getPackageById: jest.fn(),
//     updatePackage: jest.fn(),
//     getPackageRate: jest.fn(),
//     getPackageCost: jest.fn(),
//     searchPackagesByRegEx: jest.fn(),
// }));

const {
    createPackage,
    getPackageById,
    updatePackage,
    getPackageRate,
    getPackageCost,
    searchPackagesByRegEx,
} = require('../src/controllers/packageController');

describe('Package API Endpoints', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /package', () => {
        it('should return 409 for duplicate package', async () => {
            // createPackage.mockImplementationOnce((req: Request, res: Response) => {
            //     res.status(201).json({ message: 'Package created successfully' });
            // });

            const response = await request(app)
                .post('/package')
                .send(
                    {
                        "URL": "https://github.com/expressjs/express",
                        "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
                        "debloat": false,
                        "Name": "express",
                    }
                )
                .set('X-Authorization', 'valid-token');

            expect(response.status).toBe(409);
            expect(response.body).toEqual({ error: 'Package already exists' });
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app).post('/package').send().set('X-Authorization', 'valid-token');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
        });
    });

    // describe('GET /packages/:id', () => {
    //     it('should retrieve a package by ID', async () => {
    //         getPackageById.mockImplementationOnce((req: Request, res: Response) => {
    //             res.status(200).json({ ID: 1, Name: 'test-package' });
    //         });

    //         const response = await request(app).get('/packages/1');

    //         expect(response.status).toBe(200);
    //         expect(response.body).toEqual({ ID: 1, Name: 'test-package' });
    //         expect(getPackageById).toHaveBeenCalledTimes(1);
    //     });

    //     it('should return 404 if package not found', async () => {
    //         getPackageById.mockImplementationOnce((req: Request, res: Response) => {
    //             res.status(404).json({ error: 'Package not found' });
    //         });

    //         const response = await request(app).get('/packages/999');

    //         expect(response.status).toBe(404);
    //         expect(response.body).toEqual({ error: 'Package not found' });
    //         expect(getPackageById).toHaveBeenCalledTimes(1);
    //     });
    // });



    // describe('GET /package/:id/rate', () => {
    //     it('should return ratings for a valid package ID', async () => {
    //         getPackageRate.mockImplementationOnce((req: Request, res: Response) => {
    //             res.status(200).json({
    //                 "BusFactor": 0.2,
    //                 "BusFactorLatency": 0.1,
    //                 "Correctness": 0.97,
    //                 "CorrectnessLatency": 0.1,
    //                 "RampUp": 0.81,
    //                 "RampUpLatency": 0.1,
    //                 "ResponsiveMaintainer": 0.67,
    //                 "ResponsiveMaintainerLatency": 0.1,
    //                 "LicenseScore": 1,
    //                 "LicenseScoreLatency": 0.1,
    //                 "GoodPinningPractice": 0.2,
    //                 "GoodPinningPracticeLatency": 0.1,
    //                 "PullRequest": 1,
    //                 "PullRequestLatency": 0.1,
    //                 "NetScore": 0.65,
    //                 "NetScoreLatency": 0.1
    //             });
    //         });

    //         const response = await request(app).get('/package/6/rate');
    //         expect(response.status).toBe(200);
    //         expect(response.body).toEqual({
    //             "BusFactor": 0.2,
    //             "BusFactorLatency": 0.1,
    //             "Correctness": 0.97,
    //             "CorrectnessLatency": 0.1,
    //             "RampUp": 0.81,
    //             "RampUpLatency": 0.1,
    //             "ResponsiveMaintainer": 0.67,
    //             "ResponsiveMaintainerLatency": 0.1,
    //             "LicenseScore": 1,
    //             "LicenseScoreLatency": 0.1,
    //             "GoodPinningPractice": 0.2,
    //             "GoodPinningPracticeLatency": 0.1,
    //             "PullRequest": 1,
    //             "PullRequestLatency": 0.1,
    //             "NetScore": 0.65,
    //             "NetScoreLatency": 0.1
    //         });
    //     });

    //     it('should return 404 if package not found', async () => {
    //         getPackageRate.mockImplementationOnce((req: Request, res: Response) => {
    //             res.status(404).json({ error: 'Package does not exist' });
    //         });

    //         const response = await request(app).get('/package/999/rate');

    //         expect(response.status).toBe(404);
    //         expect(response.body).toEqual({ error: 'Package does not exist' });
    //     });
    // });
});
