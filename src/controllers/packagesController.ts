import { Request, Response, NextFunction } from 'express';
import pool from '../sqlhelper';
import semver from 'semver'; // For semantic versioning logic

export const getPackages = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Extract package queries and offset
        const packageQueries = req.body;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        // Validate the request body
        if (!Array.isArray(packageQueries) || packageQueries.length === 0) {
            res.status(400).json({ error: 'Request body must be a non-empty array of PackageQuery objects.' });
            return;
        }

        // Initialize query construction
        let query = 'SELECT name, id, version FROM packages WHERE ';
        const queryConditions: string[] = [];
        const queryValues: any[] = [];

        // Build query conditions based on the package queries
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

        // Ensure at least one condition is present
        if (queryConditions.length === 0) {
            res.status(400).json({ error: 'PackageQuery must include at least the "Name" field.' });
            return;
        }

        // Construct the final query
        query += queryConditions.join(' AND ');
        query += ' LIMIT 10 OFFSET ?';
        queryValues.push(offset);

        //console.log('Generated SQL Query:', query);
        //console.log('Query Values:', queryValues);

        // Execute the query
        const [rows]: [any[], any] = await pool.query(query, queryValues);

        // console.log('Fetched rows:', rows);

        // Return the filtered results
        res.status(200).json(rows.map(row => ({
            Version: row.version,
            Name: row.name,
            ID: row.id,
        })));
    } catch (error) {
        //console.error('Error fetching packages:', error);
        // res.status(500).json({ error: 'Internal Server Error' });
        next(error);
    }
};

