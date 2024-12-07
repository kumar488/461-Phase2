import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { resetTable } from '../packages/packagedb';

export const resetSystem = async (req: Request, res: Response) => {
    try {
        // const token = req.headers['x-authorization'] as string;
        // if (!token) {
        //     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        //     return;
        // }
        
        await resetTable();

        res.status(200).json({ message: 'System reset to default state successfully' });
    } catch (error) {
        console.error('Error during system reset:', error);
        res.status(500).json({ error: 'Internal Server Error during system reset' });
    }
};
