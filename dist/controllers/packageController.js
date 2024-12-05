"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchPackagesByRegEx = exports.getPackageCost = exports.getPackageRate = exports.deletePackage = exports.updatePackage = exports.getPackageById = exports.createPackage = exports.getPackageVersionRange = void 0;
const packageModel_1 = require("../models/packageModel");
const packagedb_1 = require("../packages/packagedb");
const helper_1 = require("../helper");
const main_1 = require("../main");
const sqlhelper_1 = __importDefault(require("../sqlhelper"));
const getPackageVersionRange = (packageName) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Query to get all versions for the given package name
        const [rows] = yield sqlhelper_1.default.query('SELECT version FROM packages WHERE name = ? ORDER BY version', [packageName]);
        if (rows.length === 0) {
            return `No versions found for package: ${packageName}`;
        }
        // Extract all versions from the result
        const versions = rows.map((row) => row.version);
        // If only one version, return it
        if (versions.length === 1) {
            return versions[0];
        }
        // If multiple versions, return the range
        return `${versions[0]}-${versions[versions.length - 1]}`;
    }
    catch (error) {
        console.error('Error getting package version range:', error);
        throw new Error('Internal Server Error while getting package version range');
    }
});
exports.getPackageVersionRange = getPackageVersionRange;
const createPackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Verify authorization header
        const token = req.headers['x-authorization'];
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
        let finalPackageData = Object.assign({}, packageData);
        if (packageData.Content) {
            // Content is provided, ensure required fields are present
            if (!packageData.Name) {
                res.status(400).json({ error: 'Missing required field: Name when Content is provided.' });
                return;
            }
            // Decode the zip file and extract package.json
            try {
                const packageJson = yield (0, helper_1.extractPackageJsonFromContent)(packageData.Content);
                const { name, version, repositoryUrl } = (0, helper_1.extractPackageJsonInfo)(packageJson);
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
                    finalPackageData.Content = yield (0, helper_1.debloatPackageContent)(packageData.Content);
                }
                delete finalPackageData.debloat;
            }
            catch (error) {
                res.status(400).json({ error: `Failed to process Content: ${error.message}` });
                return;
            }
        }
        else if (packageData.URL) {
            // URL is provided, process it
            const githubURL = yield (0, helper_1.getGithubURL)(packageData.URL);
            if (!githubURL) {
                res.status(400).json({ error: 'Invalid URL: Unable to resolve GitHub URL from the provided URL.' });
                return;
            }
            try {
                const { base64Content, packageJson } = yield (0, helper_1.fetchAndProcessGitHubRepo)(githubURL);
                const { name, version } = (0, helper_1.extractPackageJsonInfo)(packageJson);
                if (!name || !version) {
                    res.status(400).json({ error: 'Failed to retrieve Name or Version from GitHub repository.' });
                    return;
                }
                finalPackageData.Content = base64Content;
                finalPackageData.Name = name;
                finalPackageData.Version = version;
            }
            catch (err) {
                res.status(424).json({ error: 'Failed to fetch and process GitHub repository.' });
                return;
            }
        }
        // Add package using model
        const result = yield (0, packagedb_1.addPackage)(finalPackageData);
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
            data: Object.assign({ Content: finalPackageData.Content, JSProgram: finalPackageData.JSProgram }, (packageData.URL && { URL: packageData.URL })),
        };
        res.status(201).json(response);
    }
    catch (err) {
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
});
exports.createPackage = createPackage;
const getPackageById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const packageId = req.params.id;
        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }
        const pkg = yield (0, packageModel_1.getPackage)(packageId);
        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }
        res.status(200).json(pkg);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.getPackageById = getPackageById;
const updatePackage = (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.updatePackage = updatePackage;
const deletePackage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const packageId = req.params.id;
        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }
        const pkg = yield (0, packageModel_1.deletePackageModel)(packageId);
        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
        }
        res.status(200).json({ message: 'Package deleted', packageId });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
exports.deletePackage = deletePackage;
const getPackageRate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const packageId = req.params.id;
        const authorizationHeader = req.headers['x-authorization'];
        if (!authorizationHeader) {
            res.status(403).json({ error: 'Authentication failed due to invalid or missing AuthenticationToken.' });
        }
        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }
        const pkg = yield (0, packageModel_1.getPackage)(packageId);
        if (!pkg) {
            res.status(404).json({ error: 'Package not found' });
            return;
        }
        const rating = yield (0, main_1.getRepositoryRating)(pkg.url);
        if (rating !== null) {
            res.status(200).json({ packageId, rating });
        }
        else {
            res.status(404).json({ error: 'Package does not exist.' });
        }
        // if (packageId === '1') { //debug
        //     res.status(200).json({ packageId, rating: 4.5 });
        // } else { //debug
        //     res.status(404).json({ error: 'Package does not exist.' });
        // }
    }
    catch (error) {
        res.status(500).json({ error: 'The package rating system choked on at least one of the metrics.' });
    }
});
exports.getPackageRate = getPackageRate;
const getPackageCost = (req, res) => {
    try {
        const packageId = req.params.id;
        if (!packageId) {
            res.status(400).json({ error: 'Missing Package ID' });
        }
        // Cost calculation logic
        res.status(200).json({ cost: 100 });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.getPackageCost = getPackageCost;
const searchPackagesByRegEx = (req, res) => {
    try {
        const { regex } = req.body;
        if (!regex) {
            res.status(400).json({ error: 'Missing required field: regex' });
        }
        // Logic to search for packages based on regex
        res.status(200).json({ packages: [] });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.searchPackagesByRegEx = searchPackagesByRegEx;
//# sourceMappingURL=packageController.js.map