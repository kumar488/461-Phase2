import { Request, Response } from 'express';
import pool from '../sqlhelper';
import semver from 'semver'; // For semantic versioning logic

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

        let query = 'SELECT * FROM packages WHERE ';
        const queryConditions: string[] = [];
        const queryValues: any[] = [];

        packageQueries.forEach((packageQuery: any) => {
            if (packageQuery.Name) {
                queryConditions.push('name LIKE ?');
                queryValues.push(packageQuery.Name === '*' ? '%' : `%${packageQuery.Name}%`);
            }

            if (packageQuery.Version) {
                let versionConstraint = packageQuery.Version;

                // Normalize the version range by adding spaces around the hyphen if necessary
                if (/^\d+\.\d+\.\d+-\d+\.\d+\.\d+$/.test(versionConstraint)) {
                    versionConstraint = versionConstraint.replace('-', ' - ');
                }

                console.log(`Normalized version constraint: ${versionConstraint}`);

                if (semver.valid(versionConstraint)) {
                    // Exact version
                    queryConditions.push('version = ?');
                    queryValues.push(versionConstraint);
                } else if (semver.validRange(versionConstraint)) {
                    // Version range
                    const minVersion = semver.minVersion(versionConstraint)?.version;
                    const maxVersion = semver.maxSatisfying(
                        ['9999.9999.9999'], // High max placeholder
                        versionConstraint
                    );

                    if (minVersion) {
                        queryConditions.push('version >= ?');
                        queryValues.push(minVersion);
                    }
                    if (maxVersion) {
                        queryConditions.push('version <= ?');
                        queryValues.push(maxVersion);
                    }
                } else {
                    res.status(400).json({ error: `Invalid version constraint: ${versionConstraint}` });
                    return;
                }
            }
        });

        if (queryConditions.length === 0) {
            res.status(400).json({ error: 'PackageQuery must include at least the "Name" field.' });
            return;
        }

        query += queryConditions.join(' AND ');
        query += ' LIMIT 10 OFFSET ?';
        queryValues.push(offset);

        console.log('Generated SQL Query:', query);
        console.log('Query Values:', queryValues);

        // Execute the query
        const [rows]: [any[], any] = await pool.query(query, queryValues);

        console.log('Fetched rows:', rows);

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching packages:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
