import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

// Default system credentials for resetting the database
const DEFAULT_DB_CONFIG = {
    host: 'ece461-db.clqecqq0aufc.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: 'ECE461Pass*',
    database: 'ece461'
};

export const resetSystem = async (req: Request, res: Response) => {
    try {
        // Create a connection using the default credentials
        const connection = await mysql.createConnection(DEFAULT_DB_CONFIG);

        // Begin a transaction
        await connection.beginTransaction();

        // Delete all rows from the packages table
        await connection.query('DELETE FROM packages');

        // Delete all users except the default user
        await connection.query('DELETE FROM users WHERE username != ?', ['default_user']);

        // Insert or reset the default user (assuming username is 'default_user')
        await connection.query(`
            INSERT INTO users (username, password)
            VALUES ('default_user', 'default_password')
            ON DUPLICATE KEY UPDATE password='default_password';
        `);

        // Commit the transaction
        await connection.commit();
        await connection.end();

        res.status(200).json({ message: 'System reset to default state successfully' });
    } catch (error) {
        console.error('Error during system reset:', error);
        res.status(500).json({ error: 'Internal Server Error during system reset' });
    }
};