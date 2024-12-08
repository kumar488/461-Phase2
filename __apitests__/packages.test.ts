import request from 'supertest';
import app from '../src/app'; // Ensure this imports your Express app

jest.mock('../src/sqlhelper', () => ({
    query: jest.fn().mockResolvedValueOnce([ // Mock SQL queries
        [{ id: 6, name: 'express', version: '5.0.1' }]
    ]),
}));

describe('Packages API', () => {
    it('should return packages for a valid post /packages with bounded version range', async () => {
        const response = await request(app)
            .post('/packages')
            .send([
                {
                    "Name": "express",
                    "Version": "1.0.0-6.0.0",
                },
            ])
            .set('X-Authorization', 'valid-token');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            [
                {
                    "Version": "5.0.1",
                    "Name": 'express',
                    "ID": 6,
                },
            ]
        );
    });

    it('should return 400 for invalid request body', async () => {
        const response = await request(app)
            .post('/packages')
            .send([])
            .set('X-Authorization', 'valid-token');

        expect(response.status).toBe(400);
        expect(response.body).toEqual({
            error: 'Request body must be a non-empty array of PackageQuery objects.',
        });
    });
    it('should return 400 for invalid version string', async () => {
        const response = await request(app)
            .post('/packages')
            .send([
                {
                    "Name": "express",
                    "Version": "1.0.0?6.0.0",
                },
            ])
            .set('X-Authorization', 'valid-token');

        expect(response.status).toBe(400);
        expect(response.body).toEqual(
            {
                "error": "Invalid version constraint: 1.0.0?6.0.0"
            },
        );
    });
});
