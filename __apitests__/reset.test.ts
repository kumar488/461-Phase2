import request from 'supertest';
import mysql from 'mysql2/promise';
import app from '../src/app'; // Ensure this imports your Express app
import { resetTable } from '../src/packages/packagedb';

let connection: mysql.Connection;

beforeAll(async () => {
    // Initialize the connection
    connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });
});

afterAll(async () => {
    // Close the connection
    if (connection) {
        await connection.end();
    }
});

jest.mock('../src/packages/packagedb', () => {
    const originalModule = jest.requireActual('mysql2/promise');
    return {
        createConnection: jest.fn(async (config) => {
            return originalModule.createConnection({
                ...config,
                host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
                user: process.env.DB_USER,
                password: 'invalid-password',
                database: process.env.DB_NAME,
                port: 3306
            });
        }),
        resetTable: jest.fn(async () => {
            const config = {
                host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
                user: process.env.DB_USER,
                password: 'invalid-password',
                database: process.env.DB_NAME,
                port: 3306
            };
            const connection = await originalModule.createConnection(config);
            // Add any additional logic for resetTable if needed
            await connection.end();
        }),
    };
});

describe('Reset System API', () => {
    // beforeEach(async () => {
    //     // Seed test data
    //     await connection.query(`
    //         INSERT INTO packages (id, name, version) VALUES (1, 'test-package', '1.0.0')
    //     `);
    // });

    // afterEach(async () => {
    //     // Clean up test data
    //     await connection.query('DELETE FROM packages');
    // });

    // it('should successfully reset the system to the default state', async () => {
    //     // Mock the resetTable function to resolve successfully
    //     (resetTable as jest.Mock).mockResolvedValueOnce();

    //     const response = await request(app).delete('/reset');

    //     expect(response.status).toBe(200);
    //     expect(response.body).toEqual({
    //         message: 'System reset to default state successfully',
    //     });
    //     expect(resetTable).toHaveBeenCalled();
    // });

    it('should handle errors during system reset', async () => {
        // Mock the resetTable function to throw an error
        // (resetTable as jest.Mock).mockRejectedValueOnce(new Error('Internal Server Error during system reset'));
        // process.env.DB_PASSWORD = 'invalid-password';
        const response = await request(app).delete('/reset');

        expect(response.status).toBe(401);
        expect(response.body).toEqual({
            error: 'You do not have permission to reset the registry.',
        });
        expect(resetTable).toHaveBeenCalledTimes(1);
    });

    // it('should return 403 if the authorization header is missing', async () => {
    //     const response = await request(app).post('/reset').set('X-Authorization', '');

    //     expect(response.status).toBe(403);
    //     expect(response.body).toEqual({
    //         error: 'Authentication failed due to invalid or missing AuthenticationToken.',
    //     });
    // });
});
