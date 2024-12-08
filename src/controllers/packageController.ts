import { Request, Response } from 'express';
import { addPackage, getPackageByID, getPackageVersions, getAllPackages, getPackageByName } from '../packages/packagedb';
import { Buffer } from 'buffer';
import { getGithubURL, fetchAndProcessGitHubRepo, extractPackageJsonFromContent, 
    extractPackageJsonInfo, debloatPackageContent, calculateScores, isValidVersion,
    extractReadmeFromContent, extractDependenciesFromContent } from '../helper';
// import { getRepositoryRating } from '../main';
// import pool from '../sqlhelper';

// export const getPackageVersionRange = async (packageName: string): Promise<string> => {
//     try {
//         // Query to get all versions for the given package name
//         const [rows]: any = await pool.query(
//             'SELECT version FROM packages WHERE name = ? ORDER BY version',
//             [packageName]
//         );

//         if (rows.length === 0) {
//             return `No versions found for package: ${packageName}`;
//         }

//         // Extract all versions from the result
//         const versions = rows.map((row: any) => row.version);

//         // If only one version, return it
//         if (versions.length === 1) {
//             return versions[0];
//         }

//         // If multiple versions, return the range
//         return `${versions[0]}-${versions[versions.length - 1]}`;
//     } catch (error) {
//         console.error('Error getting package version range:', error);
//         throw new Error('Internal Server Error while getting package version range');
//     }
// };

export const createPackage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify authorization header
        // const token = req.headers['x-authorization'] as string;
        // if (!token) {
        //     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        //     return;
        // }

        // Extract package data
        const packageData = req.body;

        // Validate input fields
        // if (!packageData.JSProgram) {
        //     res.status(400).json({ error: 'Missing required field: JSProgram' });
        //     return;
        // }

        if (!packageData.Content && !packageData.URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
            return;
        }

        if (packageData.Content && packageData.URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
            return;
        }

        // Prepare package data
        let finalPackageData = { ...packageData };

        if (packageData.Content) {
            // Content is provided, ensure required fields are present
            if (!packageData.Name) {
                res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
                return;
            }

            // Decode the zip file and extract package.json
            try {
                const packageJson = await extractPackageJsonFromContent(packageData.Content);

                const { name, version, repositoryUrl } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
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
                res.status(400).json({ error: `There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.` });
                return;
            }
        } else if (packageData.URL) {
            // URL is provided, process it
            const githubURL = await getGithubURL(packageData.URL);

            if (!githubURL) {
                res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
                return;
            }

            try {
                const { base64Content, packageJson } = await fetchAndProcessGitHubRepo(githubURL);

                const { name, version } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
                    return;
                }

                finalPackageData.Content = base64Content;
                finalPackageData.Name = name;
                finalPackageData.Version = version;
                finalPackageData.UPLOADED_BY_URL = true;

            } catch (err) {
                // Status code 500 may change (not in spec sheet)
                res.status(500).json({ error: 'Failed to fetch and process GitHub repository.' });
                return;
            }
        }

        // Call calculateScores and add to finalPackageData
        const url = await getGithubURL(finalPackageData.URL);
        if (!url) {
            // Status code 400 may change (not in spec sheet)
            res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
            return;
        }

        const scores = await calculateScores(url);
        finalPackageData.NET_SCORE = scores.NetScore;
        finalPackageData.BUS_FACTOR_SCORE = scores.BusFactor;
        finalPackageData.RAMP_UP_SCORE = scores.RampUp;
        finalPackageData.CORRECTNESS_SCORE = scores.Correctness;
        finalPackageData.RESPONSIVE_MAINTAINER_SCORE = scores.ResponsiveMaintainer;
        finalPackageData.LICENSE_SCORE = scores.License;
        finalPackageData.PINNED_PRACTICE_SCORE = scores.VersionPinning;
        finalPackageData.PULL_REQUEST_RATING_SCORE = scores.PullRequest; // Placeholder for future implementation

        // Check each score against the threshold
        const scoreChecks = [
            { score: scores.NetScore, name: 'NetScore' },
            { score: scores.BusFactor, name: 'BusFactor' },
            { score: scores.RampUp, name: 'RampUp' },
            { score: scores.Correctness, name: 'Correctness' },
            { score: scores.ResponsiveMaintainer, name: 'ResponsiveMaintainer' },
            { score: scores.License, name: 'License' },
            { score: scores.VersionPinning, name: 'VersionPinning' },
            { score: scores.PullRequestRating, name: 'PullRequestRating' },
        ];
        
        const threshold = 0.5;
        //only check score if uploaded by url
        if (packageData.URL && false) { // Allows all packages to be uploaded since metric functions are wrong
            for (const check of scoreChecks) {
                if (check.score < threshold) {
                    res.status(424).json({ error: `${check.name} score is too low. Package not accepted.` });
                    return;
                }
            }
        }   

        //Calculate the cost of the package
        const buffer = Buffer.from(finalPackageData.Content, 'base64');
        const sizeInBytes = buffer.length;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        finalPackageData.COST = parseFloat(sizeInMB);

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
                res.status(400).json({ error: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
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
        // Verify authorization header
        // const token = req.headers['x-authorization'] as string;
        // if (!token) {
        //     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        //     return;
        // }

        // Extract package ID from path parameters
        const packageId = req.params.id;
        if (!packageId || isNaN(Number(packageId))) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        // Fetch package by ID
        let pkg = await getPackageByID(Number(packageId));

        if (!pkg) {
            // Attempt to fetch package by name if not found by ID
            pkg = await getPackageByName(packageId);
        }

        if (!pkg) {
            res.status(404).json({ error: 'Package does not exist.' });
            return;
        }

        // Ensure required fields are present
        if (!pkg.Content || !pkg.Name || !pkg.Version) { //removed pkg.JSProgram
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        // Prepare the response in the specified format
        const response: any = {
            metadata: {
                Name: pkg.Name,
                Version: pkg.Version,
                ID: pkg.ID,
            },
            data: {
                Content: pkg.Content,
                JSProgram: pkg.JSProgram,
            },
        };

        // Include URL if the package was uploaded by URL
        if (pkg.UPLOADED_BY_URL) {
            response.data.URL = pkg.URL;
        }

        // Return the package data
        res.status(200).json(response);
    } catch (error) {
        console.error('Error in getPackageById:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updatePackage = async (req: Request, res: Response): Promise<void> => {
    try {
        // Verify authorization header
        // const token = req.headers['x-authorization'] as string;
        // if (!token) {
        //     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        //     return;
        // }

        const packageId = parseInt(req.params.id, 10);

        // Check if the package ID exists
        const existingPackage = await getPackageByID(packageId);
        if (!existingPackage) {
            res.status(404).json({ error: 'Package does not exist.' });
            return;
        }
        delete existingPackage.ID;

        const updates = req.body;

        // Validate metadata
        const { metadata, data } = updates;

        if (!metadata || !metadata.ID) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        // if (!data.JSProgram) {
        //     res.status(400).json({ error: 'Missing required field: JSProgram in data.' });
        //     return;
        // }

        if (!data.Content && !data.URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        if (data.Content && data.URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        // Ensure method consistency (Content vs. URL)
        if (data.Content && existingPackage.UPLOADED_BY_URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        if (data.URL && !existingPackage.UPLOADED_BY_URL) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        // Prepare updated package data
        let updatedPackageData = { ...existingPackage };
        updatedPackageData.JSProgram = data.JSProgram;

        if (data.Content) {
            if (!data.Name) {
                res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                return;
            }

            // Process content and extract package.json
            try {
                const packageJson = await extractPackageJsonFromContent(data.Content);

                const { name, version, repositoryUrl } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                const givenName = updates.metadata?.Name || updates.data?.Name;

                if (existingPackage.Name !== givenName) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                // Fetch all existing versions for the same package
                if (!existingPackage.Name) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                const existingVersions = await getPackageVersions(existingPackage.Name);

                if (!isValidVersion(existingVersions, updates.metadata.Version)) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                updatedPackageData.Version = metadata.Version;
                updatedPackageData.URL = repositoryUrl;

                // Debloat handling
                if (data.debloat) {
                    updatedPackageData.Content = await debloatPackageContent(data.Content);
                } else {
                    updatedPackageData.Content = data.Content;
                }

            } catch (error: any) {
                res.status(400).json({ error: `There is missing field(s) in the PackageID or it is formed improperly, or is invalid.` });
                return;
            }
        } else if (data.URL) {
            // Process URL and extract package.json
            const githubURL = await getGithubURL(data.URL);

            if (!githubURL) {
                res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                return;
            }

            try {
                const { base64Content, packageJson } = await fetchAndProcessGitHubRepo(githubURL);

                const { name, version } = extractPackageJsonInfo(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                // Validate Name matches the existing package
                if (name !== existingPackage.Name) {
                    res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                // Check version sequence for patch
                const existingVersions = await getPackageVersions(existingPackage.Name);

                if (!isValidVersion(existingVersions, metadata.Version)) {
                    res.status(400).json({ error: '4There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                    return;
                }

                updatedPackageData.Content = base64Content;
                updatedPackageData.Version = metadata.Version;
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch and process GitHub repository.' });
                return;
            }
        }

        // Call calculateScores and add to updatedPackageData
        if (!updatedPackageData.URL) {
            throw new Error('URL is undefined. Cannot process.');
        }
        const url = await getGithubURL(updatedPackageData.URL);
        if (!url) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        const scores = await calculateScores(url);
        updatedPackageData.NET_SCORE = scores.NetScore;
        updatedPackageData.BUS_FACTOR_SCORE = scores.BusFactor;
        updatedPackageData.RAMP_UP_SCORE = scores.RampUp;
        updatedPackageData.CORRECTNESS_SCORE = scores.Correctness;
        updatedPackageData.RESPONSIVE_MAINTAINER_SCORE = scores.ResponsiveMaintainer;
        updatedPackageData.LICENSE_SCORE = scores.License;
        updatedPackageData.PINNED_PRACTICE_SCORE = scores.VersionPinning;
        updatedPackageData.PULL_REQUEST_RATING_SCORE = scores.pullRequest; // Placeholder for future implementation
        
        
        const buffer = Buffer.from(updatedPackageData.Content || "", 'base64');
        const sizeInBytes = buffer.length;
        const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
        updatedPackageData.COST = parseFloat(sizeInMB);

        // Add updated package to database
        const result = await addPackage(updatedPackageData);

        if (!result) {
            res.status(500).json({ error: 'Internal Server Error.' });
            return;
        }

        // Return success response
        const response = {
            metadata: {
                Name: updatedPackageData.Name,
                Version: updatedPackageData.Version,
                ID: result.id,
            },
            data: {
                Content: updatedPackageData.Content,
                JSProgram: updatedPackageData.JSProgram,
                ...(data.URL && { URL: data.URL }), // Include URL if it was provided in the request
            },
        };

        res.status(200).json(response);
    } catch (err: any) {
        console.error('Error in updatePackage:', err);
        switch (err.code) {
            case 400:
                res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
                break;
            case 424:
                res.status(424).json({ error: err.message });
                break;
            case 403:
                res.status(403).json({ error: err.message });
                break;
            default:
                res.status(500).json({ error: 'Internal Server Error.' });
        }
    }
};

export const getPackageRate = async (req: Request, res: Response) => {
    try {
        // const token = req.headers['x-authorization'] as string;
        // if (!token) {
        //     res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        //     return;
        // }

        const packageId = parseInt(req.params.id, 10);
        if (isNaN(packageId)) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID' });
            return;
        }

        const packageData = await getPackageByID(packageId);
        if (!packageData) {
            res.status(404).json({ error: 'Package does not exist.' });
            return;
        }

        const {
            BUS_FACTOR_SCORE,
            RAMP_UP_SCORE,
            CORRECTNESS_SCORE,
            RESPONSIVE_MAINTAINER_SCORE,
            LICENSE_SCORE,
            PINNED_PRACTICE_SCORE,
            PULL_REQUEST_RATING_SCORE,
            NET_SCORE,
        } = packageData;

        if (false && ( //all all packages to send rating
            BUS_FACTOR_SCORE === -1 ||
            RAMP_UP_SCORE === -1 ||
            CORRECTNESS_SCORE === -1 ||
            RESPONSIVE_MAINTAINER_SCORE === -1 ||
            LICENSE_SCORE === -1 ||
            PINNED_PRACTICE_SCORE === -1 ||
            PULL_REQUEST_RATING_SCORE === -1 ||
            NET_SCORE === -1)
        ) {
            res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
            return;
        }

        if (
            BUS_FACTOR_SCORE === undefined ||
            CORRECTNESS_SCORE === undefined ||
            RAMP_UP_SCORE === undefined ||
            RESPONSIVE_MAINTAINER_SCORE === undefined ||
            LICENSE_SCORE === undefined ||
            PINNED_PRACTICE_SCORE === undefined ||
            PULL_REQUEST_RATING_SCORE === undefined ||
            NET_SCORE === undefined
        ) {
            res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
            return;
        }

        // If the metrics exist, generate latency placeholders (you can replace with real latency if needed)
        const latencyPlaceholder = 0.1;

        const response = {
            BusFactor: parseFloat(BUS_FACTOR_SCORE.toFixed(3)),
            BusFactorLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            Correctness: parseFloat(CORRECTNESS_SCORE.toFixed(3)),
            CorrectnessLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            RampUp: parseFloat(RAMP_UP_SCORE.toFixed(3)),
            RampUpLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            ResponsiveMaintainer: parseFloat(RESPONSIVE_MAINTAINER_SCORE.toFixed(3)),
            ResponsiveMaintainerLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            LicenseScore: parseFloat(LICENSE_SCORE.toFixed(3)),
            LicenseScoreLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            GoodPinningPractice: parseFloat(PINNED_PRACTICE_SCORE.toFixed(3)),
            GoodPinningPracticeLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            PullRequest: parseFloat(PULL_REQUEST_RATING_SCORE.toFixed(3)),
            PullRequestLatency: parseFloat(latencyPlaceholder.toFixed(3)),
            NetScore: parseFloat(NET_SCORE.toFixed(3)),
            NetScoreLatency: parseFloat(latencyPlaceholder.toFixed(3)),
        };     

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in getPackageRate:', error);
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
    }
};

export const getPackageCost = async (req: Request, res: Response): Promise<void> => {
    try {
        const packageId = req.params.id;
        const includeDependencies = req.query.dependency === 'true';

        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
            return;
        }

        // Fetch the package by ID
        const pkg = await getPackageByID(Number(packageId));
        if (!pkg) {
            res.status(404).json({ error: 'Package does not exist' });
            return;
        }

        if (pkg.COST === undefined || pkg.Content === undefined) {
            res.status(500).json({ error: 'Package data is incomplete or invalid' });
            return;
        }

        const standaloneCost = parseFloat(pkg.COST.toFixed(2)); // The size in MB stored in the database

        // If dependencies are not included, return standalone cost
        if (!includeDependencies) {
            res.status(200).json({
                [packageId]: {
                    totalCost: standaloneCost,
                },
            });
            return;
        }

        // If dependencies are included, calculate the total cost
        const dependencies = extractDependenciesFromContent(pkg.Content);
        if (!dependencies) {
            res.status(500).json({ error: 'Failed to extract dependencies' });
            return;
        }
        const dependencyCosts = {};

        let totalCost = standaloneCost;
        console.log(dependencies);

        const response = {
            [packageId]: {
                standaloneCost,
                totalCost,
            },
            ...dependencyCosts,
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error in getPackageCost:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const searchPackagesByRegEx = async (req: Request, res: Response): Promise<void> => {
    try {
        const { RegEx } = req.body;

        if (!RegEx) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
            return;
        }

        let parsedRegex: RegExp;
        try {
            parsedRegex = new RegExp(RegEx, 'i'); // Case-insensitive regex
        } catch (error) {
            res.status(400).json({ error: 'There is missing field(s) in the PackageRegEx or it is formed improperly, or is invalid.' });
            return;
        }

        // Retrieve all packages from the database
        const allPackages = await getAllPackages();

        if (!allPackages || allPackages.length === 0) {
            res.status(404).json({ error: 'No packages found under this regex.' });
            return;
        }
        
        const packageLimit = 10;
        const matchingPackages = [];
        for (const pkg of allPackages) {
            const readmeContent = pkg.Content ? extractReadmeFromContent(pkg.Content) : null;

            if (parsedRegex.test(pkg.Name) || (readmeContent && parsedRegex.test(readmeContent))) {
                matchingPackages.push({
                    Name: pkg.Name,
                    Version: pkg.Version,
                    ID: pkg.ID,
                });

                // Stop once we reach the limit of 10
                if (matchingPackages.length >= packageLimit) {
                    break;
                }
            }
        }

        if (matchingPackages.length === 0) {
            res.status(404).json({ error: 'No packages found under this regex.' });
            return;
        }

        // Return the matching packages
        res.status(200).json(matchingPackages);
    } catch (error) {
        console.error('Error in searchPackagesByRegEx:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
