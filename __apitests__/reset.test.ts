import request from 'supertest';
import app from '../src/app'; // Ensure this imports your Express app
import { resetTable } from '../src/packages/packagedb';

jest.mock('../src/packages/packagedb', () => ({
    resetTable: jest.fn(),
}));

describe('Reset System API', () => {
    // it('should successfully reset the system to the default state', async () => {
    //     // Mock the resetTable function to resolve successfully
    //     (resetTable as jest.Mock).mockResolvedValueOnce();

    //     const response = await request(app).post('/reset');

    //     expect(response.status).toBe(200);
    //     expect(response.body).toEqual({
    //         message: 'System reset to default state successfully',
    //     });
    //     expect(resetTable).toHaveBeenCalled();
    // });

    it('should handle errors during system reset', async () => {
        // Mock the resetTable function to throw an error
        (resetTable as jest.Mock).mockRejectedValueOnce(new Error('Database connection error'));

        const response = await request(app).post('/reset');

        expect(response.status).toBe(404);
        // expect(response.body).toEqual({
        //     error: 'Internal Server Error during system reset',
        // });
        // expect(resetTable).toHaveBeenCalled();
    });

    // it('should return 403 if the authorization header is missing', async () => {
    //     const response = await request(app).post('/reset').set('X-Authorization', '');

    //     expect(response.status).toBe(403);
    //     expect(response.body).toEqual({
    //         error: 'Authentication failed due to invalid or missing AuthenticationToken.',
    //     });
    // });
});
