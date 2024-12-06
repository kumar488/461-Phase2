import { Request, Response } from 'express';
import pool from '../sqlhelper';
import semver from 'semver'; // Importing semver for version range handling

export const getPackages = async (req: Request, res: Response) => {
    try {
        const authorizationHeader = req.headers['x-authorization'];

        // Authentication check
        if (!authorizationHeader) {
            res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
            return;
        }

        const packageQueries = req.body;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        // Validate the request body
        if (!Array.isArray(packageQueries) || packageQueries.length === 0) {
            res.status(400).json({ error: 'Request body must be a non-empty array of PackageQuery objects.' });
            return;
        }

        // SQL query construction based on the packageQueries
        let query = 'SELECT * FROM packages WHERE ';
        const queryConditions: string[] = [];
        const queryValues: any[] = [];

        packageQueries.forEach((packageQuery: any) => {
            if (packageQuery.Name) {
                queryConditions.push('name LIKE ?');
                queryValues.push(packageQuery.Name === '*' ? '%' : `%${packageQuery.Name}%`);
            }
            if (packageQuery.Version) {
                const version = packageQuery.Version;

                if (semver.valid(version)) {
                    // Exact version
                    queryConditions.push('version = ?');
                    queryValues.push(version);
                } else if (semver.validRange(version)) {
                    // Bounded range, caret, tilde
                    queryConditions.push('version BETWEEN ? AND ?');
                    const range = semver.minVersion(version);
                    if (range) {
                        queryValues.push(range.version, version);
                    }
                } else {
                    res.status(400).json({ error: 'Invalid version format.' });
                    return;
                }
            }
        });

        if (queryConditions.length === 0) {
            res.status(400).json({ error: 'PackageQuery must include at least one field: Name or Version.' });
            return;
        }

        query += queryConditions.join(' AND ');
        query += ' LIMIT 10 OFFSET ?';
        queryValues.push(offset);

        // Execute the query
        const [rows]: [any[], any] = await pool.query(query, queryValues);

        if (rows.length > 10) {
            res.status(413).json({ error: 'Too many packages returned.' });
            return;
        }

        // Format the response
        res.setHeader('offset', (offset + rows.length).toString());
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
