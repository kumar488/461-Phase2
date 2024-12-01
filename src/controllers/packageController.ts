import { Request, Response } from 'express';
import { getAllPackages, getPackage, createPackageModel, deletePackageModel } from '../models/packageModel';
import { addPackage } from '../packages/packagedb';
import { Buffer } from 'buffer';
import { getGithubURL, fetchAndProcessGitHubRepo, extractPackageJsonFromContent, extractPackageJsonInfo, debloatPackageContent } from '../helper';
import { getRepositoryRating } from '../main';

export const getPackageVersionRange = async (packageName: string): Promise<string> => {
    try {
        // Query to get all versions for the given package name
        const [rows]: any = await pool.query(
            'SELECT version FROM packages WHERE name = ? ORDER BY version',
            [packageName]
        );

        if (rows.length === 0) {
            return `No versions found for package: ${packageName}`;
        }

        // Extract all versions from the result
        const versions = rows.map((row: any) => row.version);

        // If only one version, return it
        if (versions.length === 1) {
            return versions[0];
        }

        // If multiple versions, return the range
        return `${versions[0]}-${versions[versions.length - 1]}`;
    } catch (error) {
        console.error('Error getting package version range:', error);
        throw new Error('Internal Server Error while getting package version range');
    }
};

export const createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify authorization header
        const token = req.headers['x-authorization'] as string;
        if (!token) {
            res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
            return;
        }

        // Extract package data
        const packageData = req.body;

        // Validate input fields
        if (!packageData.JSProgram) {
            res.status(400).json({ error: 'Missing required field: JSProgram' });
            return;
        }

        if (!packageData.Content && !packageData.URL) {
            res.status(400).json({ error: 'Either Content or URL must be provided.' });
            return;
        }

        if (packageData.Content && packageData.URL) {
            res.status(400).json({ error: 'Content and URL cannot both be provided.' });
            return;
        }

        // Prepare package data
        let finalPackageData = { ...packageData };

        if (packageData.Content) {
            // Content is provided, ensure required fields are present
            if (!packageData.Name) {
                res.status(400).json({ error: 'Missing required field: Name when Content is provided.' });
                return;
            }

            // Decode the zip file and extract package.json
            try {
                const packageJson = await extractPackageJsonFromContent(packageData.Content);

                const { name, version, repositoryUrl } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'Failed to retrieve Name or Version from package.json.' });
                    return;
                }

                // finalPackageData.Name = name;
                finalPackageData.Version = version;
                finalPackageData.URL = repositoryUrl;

                // Debloat handling
                if (packageData.debloat) {
                    // Placeholder for future debloat function
                    finalPackageData.Content = await debloatPackageContent(packageData.Content);
                }
                delete finalPackageData.debloat;
            } catch (error : any) {
                res.status(400).json({ error: `Failed to process Content: ${error.message}` });
                return;
            }
        } else if (packageData.URL) {
            // URL is provided, process it
            const githubURL = await getGithubURL(packageData.URL);

            if (!githubURL) {
                res.status(400).json({ error: 'Invalid URL: Unable to resolve GitHub URL from the provided URL.' });
                return;
            }

            try {
                const { base64Content, packageJson } = await fetchAndProcessGitHubRepo(githubURL);

                const { name, version } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'Failed to retrieve Name or Version from GitHub repository.' });
                    return;
                }

                finalPackageData.Content = base64Content;
                finalPackageData.Name = name;
                finalPackageData.Version = version;
            } catch (err) {
                res.status(424).json({ error: 'Failed to fetch and process GitHub repository.' });
                return;
            }
        }

        // Add package using model
        const result = await addPackage(finalPackageData);

        if (!result) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Return success response
        const response = {
            metadata: {
                Name: finalPackageData.Name,
                Version: finalPackageData.Version,
                ID: result.id || finalPackageData.Name.toLowerCase(),
            },
            data: {
                Content: finalPackageData.Content,
                JSProgram: finalPackageData.JSProgram,
                ...(packageData.URL && { URL: packageData.URL }), // Only include URL if it was given in the request
            },
        };

        res.status(201).json(response);
    } catch (err: any) {
        console.error('Error in createPackage:', err); // Debugging
        switch (err.code) {
            case 400:
                res.status(400).json({ error: err.message });
                break;
            case 409:
                res.status(409).json({ error: err.message });
                break;
            case 424:
                res.status(424).json({ error: err.message });
                break;
            case 403:
                res.status(403).json({ error: err.message });
                break;
            default:
                res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
  

export const getPackageById = async (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        const pkg = await getPackage(packageId);

        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }

        res.status(200).json(pkg);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updatePackage = (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;
        const updates = req.body;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        if (!updates) {
            res.status(400).json({ error: 'No update information provided' });
        }

        // Assume we have a model function to update a package
        // updatePackageModel(packageId, updates);

        res.status(200).json({ message: 'Package updated', packageId, updates });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deletePackage = async (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        const pkg = await deletePackageModel(packageId);

        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }

        res.status(200).json({ message: 'Package deleted', packageId });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getPackageRate = async (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;
        const authorizationHeader = req.headers['x-authorization'];

        if (!authorizationHeader) {
            res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        }

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        const pkg = await getPackage(packageId);

        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
            return;
        }

        const rating = await getRepositoryRating(pkg.url);
        if (rating !== null) {
            res.status(200).json({ packageId, rating });
        } else {
            res.status(404).json({ error: 'Package does not exist.' });
        }
        // if (packageId === '1') { //debug
        //     res.status(200).json({ packageId, rating: 4.5 });
        // } else { //debug
        //     res.status(404).json({ error: 'Package does not exist.' });
        // }
    } catch (error) {
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
    }
};

export const getPackageCost = (req: Request, res: Response) => {
    try {
        const packageId = req.params.id;

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }

        // Cost calculation logic
        res.status(200).json({ cost: 100 });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const searchPackagesByRegEx = (req: Request, res: Response) => {
    try {
        const { regex } = req.body;

        if (!regex) {
            res.status(400).json({ error: 'Missing required field: regex' });
        }

        // Logic to search for packages based on regex
        res.status(200).json({ packages: [] });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
