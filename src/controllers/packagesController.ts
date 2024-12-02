import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

// Create MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Maximum number of packages that can be returned in a single request
const MAX_PACKAGES_LIMIT = 10;

// Get the list of packages from the registry
export const getPackages = async (req: Request, res: Response) => {
    try {
        // Extract request header and body
        const authorizationHeader = req.headers['x-authorization'];
        const packageQueries = req.body; // Expecting an array of queries
        const offset = parseInt(req.query.offset as string) || 0;

        // Check if authorization header is provided
        if (!authorizationHeader) {
            return res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        }

        // Validate the request body
        if (!Array.isArray(packageQueries) || packageQueries.length === 0) {
            return res.status(400).json({ error: 'Invalid PackageQuery or missing fields' });
        }

        // Extract query criteria - assuming only one query with "name" as key for now
        const packageQuery = packageQueries[0];
        const packageName = packageQuery.name;

        if (!packageName) {
            return res.status(400).json({ error: 'PackageQuery must include a valid package name' });
        }

        // If too many packages are requested, respond with 413
        if (packageQueries.length > MAX_PACKAGES_LIMIT) {
            return res.status(413).json({ error: 'Too many packages requested. Maximum limit is ' + MAX_PACKAGES_LIMIT });
        }

        // SQL query - search for packages fitting the query
        let sqlQuery = 'SELECT id, name, version FROM packages';
        const queryParams: any[] = [];

        if (packageName !== '*') {
            sqlQuery += ' WHERE name LIKE ?';
            queryParams.push(packageName);
        }

        sqlQuery += ' LIMIT ? OFFSET ?';
        queryParams.push(MAX_PACKAGES_LIMIT, offset);

        // Execute the SQL query
        const [rows]: any = await pool.query(sqlQuery, queryParams);

        if (rows.length === 0) {
            return res.status(200).json([]); // Empty list if no packages found
        }

        // Format the response to match the expected schema
        const packages = rows.map((row: any) => ({
            ID: row.id,
            Name: row.name,
            Version: row.version
        }));

        // Include the offset for pagination in response headers
        res.set('offset', String(offset + MAX_PACKAGES_LIMIT));

        // Return the list of packages
        res.status(200).json(packages);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

