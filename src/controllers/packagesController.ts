import { Request, Response } from 'express';
import pool from '../sqlhelper';

export const getPackages = async (req: Request, res: Response) => {
    try {
        const authorizationHeader = req.headers['x-authorization'];

        // Authentication check
        if (!authorizationHeader) {
            return res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        }

        const packageQueries = req.body;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        // Validate the request body
        if (!Array.isArray(packageQueries) || packageQueries.length === 0) {
            return res.status(400).json({ error: 'Request body must be a non-empty array of PackageQuery objects.' });
        }

        // SQL query construction based on the packageQueries
        let query = 'SELECT * FROM packages WHERE ';
        const queryConditions: string[] = [];
        const queryValues: any[] = [];

        packageQueries.forEach((packageQuery) => {
            if (packageQuery.Name) {
                queryConditions.push('name LIKE ?');
                queryValues.push(packageQuery.Name === '*' ? '%' : `%${packageQuery.Name}%`);
            }
            if (packageQuery.Version) {
                queryConditions.push('version = ?');
                queryValues.push(packageQuery.Version);
            }
        });

        if (queryConditions.length === 0) {
            return res.status(400).json({ error: 'PackageQuery must include at least one field: Name or Version.' });
        }

        query += queryConditions.join(' AND ');
        query += ' LIMIT 10 OFFSET ?';
        queryValues.push(offset);

        // Execute the query
        const [rows, fields]: [any[], any[]] = await pool.query(query, queryValues);

        if (rows.length > 10) {
            return res.status(413).json({ error: 'Too many packages returned.' });
        }

        // Format the response
        res.setHeader('offset', offset + rows.length);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
