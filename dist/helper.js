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
exports.debloatPackageContent = exports.extractPackageJsonFromContent = exports.extractPackageJsonInfo = exports.toBase64 = exports.fetchAndProcessGitHubRepo = exports.getGithubURL = void 0;
const axios_1 = __importDefault(require("axios"));
const json5_1 = require("json5");
const adm_zip_1 = __importDefault(require("adm-zip"));
const getGithubURL = (url) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (url.includes('github.com')) {
        return url; // Already a GitHub URL
    }
    if (url.includes('npmjs.com')) {
        try {
            const response = yield axios_1.default.get(url);
            const packageJSONURL = (_a = response.data.repository) === null || _a === void 0 ? void 0 : _a.url;
            if (packageJSONURL && packageJSONURL.includes('github.com')) {
                return packageJSONURL.replace(/^git\+/, '').replace(/\.git$/, '');
            }
        }
        catch (err) {
            console.error('Error resolving GitHub URL from npm:', err);
        }
    }
    return null; // Unable to resolve
});
exports.getGithubURL = getGithubURL;
const fetchDefaultBranch = (githubURL) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repoApiUrl = githubURL.replace('github.com', 'api.github.com/repos');
        const response = yield axios_1.default.get(repoApiUrl);
        return response.data.default_branch; // Fetch the default branch (e.g., main, master)
    }
    catch (error) {
        console.error('Error fetching default branch:', error);
        throw new Error('Failed to fetch default branch for the repository.');
    }
});
// Utility to check if a string is a valid semantic version
const isValidSemver = (version) => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
};
// Extract version from package.json or VERSION file
const extractVersion = (githubURL, branch) => __awaiter(void 0, void 0, void 0, function* () {
    const apiUrl = githubURL.replace('github.com', 'raw.githubusercontent.com');
    const filesToCheck = [`package.json`, `VERSION`, `version.txt`];
    for (const file of filesToCheck) {
        try {
            const fileUrl = `${apiUrl}/${branch}/${file}`;
            const response = yield axios_1.default.get(fileUrl);
            if (file === 'package.json') {
                const packageJson = JSON.parse(response.data);
                if (packageJson.version && isValidSemver(packageJson.version)) {
                    return packageJson.version;
                }
            }
            else {
                const version = response.data.trim();
                if (isValidSemver(version)) {
                    return version;
                }
            }
        }
        catch (_a) {
            // Ignore missing files or invalid versions and continue to the next
        }
    }
    return '1.0.0'; // Default if no valid version found
});
// Main function to fetch and process GitHub repo
const fetchAndProcessGitHubRepo = (githubURL) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the default branch of the GitHub repository
        const defaultBranch = yield fetchDefaultBranch(githubURL);
        // Construct the URL to download the zip file
        const zipURL = `${githubURL}/archive/refs/heads/${defaultBranch}.zip`;
        // Fetch the zip file from GitHub
        const response = yield axios_1.default.get(zipURL, { responseType: 'arraybuffer' });
        const base64Content = Buffer.from(response.data).toString('base64');
        // Extract the zip file
        const zip = new adm_zip_1.default(response.data);
        const zipEntries = zip.getEntries();
        // Look for package.json in all entries
        const packageJsonEntry = zipEntries.find((entry) => entry.entryName.endsWith('/package.json'));
        if (!packageJsonEntry) {
            throw new Error('package.json not found in the repository.');
        }
        const packageJson = packageJsonEntry.getData().toString('utf8');
        // Return the Base64 zip content and the extracted package.json
        return { base64Content, packageJson };
    }
    catch (error) {
        console.error('Error fetching and processing GitHub repository:', error);
        throw new Error('Failed to fetch and process GitHub repository.');
    }
});
exports.fetchAndProcessGitHubRepo = fetchAndProcessGitHubRepo;
const toBase64 = (data) => {
    return Buffer.from(data).toString('base64');
};
exports.toBase64 = toBase64;
const extractPackageJsonInfo = (packageJson) => {
    var _a;
    try {
        const parsedJson = (0, json5_1.parse)(packageJson);
        const name = parsedJson.name;
        const version = parsedJson.version;
        const repositoryUrl = (_a = parsedJson.repository) === null || _a === void 0 ? void 0 : _a.url;
        return { name, version, repositoryUrl };
    }
    catch (error) {
        throw new Error('Invalid package.json format.');
    }
};
exports.extractPackageJsonInfo = extractPackageJsonInfo;
const extractPackageJsonFromContent = (base64Content) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Decode the Base64 content
        const buffer = Buffer.from(base64Content, 'base64');
        const zip = new adm_zip_1.default(buffer);
        // Get all entries in the zip file
        const zipEntries = zip.getEntries();
        // Look for package.json in all entries
        const packageJsonEntry = zipEntries.find((entry) => entry.entryName.endsWith('/package.json'));
        if (!packageJsonEntry) {
            throw new Error('package.json not found in the uploaded zip file.');
        }
        // Return the contents of package.json as a string
        return packageJsonEntry.getData().toString('utf8');
    }
    catch (error) {
        console.error('Error extracting package.json from content:', error);
        throw new Error('Failed to extract package.json from the uploaded content.');
    }
});
exports.extractPackageJsonFromContent = extractPackageJsonFromContent;
const debloatPackageContent = (content) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO: Implement tree shaking, minification, and other debloat techniques
    return content; // Currently returns unmodified content
});
exports.debloatPackageContent = debloatPackageContent;
//# sourceMappingURL=helper.js.map