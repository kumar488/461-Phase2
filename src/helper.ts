import axios from 'axios';
import { parse } from 'json5';
import AdmZip from 'adm-zip';
import calculateNetScore, { calculateBusFactorScore, calculateCorrectness,
    calculateRampUpScore, calculateResponsiveMaintainerScore, calculateVersionPinning
  } from './CalculateMetrics';

import  {fetchRepositoryUsers, fetchRepositoryIssues,
RepositoryIssues, RepositoryUsers, fetchRepositoryDependencies, RepositoryDependencies
} from './GitHubAPIcaller';                          

import { getLicense } from './License';

export const getGithubURL = async (url: string): Promise<string | null> => {
    if (url.includes('github.com')) {
      return url; // Already a GitHub URL
    }
  
    if (url.includes('npmjs.com')) {
      try {
        const response = await axios.get(url);
        const packageJSONURL = response.data.repository?.url;
        if (packageJSONURL && packageJSONURL.includes('github.com')) {
          return packageJSONURL.replace(/^git\+/, '').replace(/\.git$/, '');
        }
      } catch (err) {
        console.error('Error resolving GitHub URL from npm:', err);
      }
    }
  
    return null; // Unable to resolve
};

const fetchDefaultBranch = async (githubURL: string): Promise<string> => {
    try {
      const repoApiUrl = githubURL.replace('github.com', 'api.github.com/repos');
      const response = await axios.get(repoApiUrl);
      return response.data.default_branch; // Fetch the default branch (e.g., main, master)
    } catch (error) {
      console.error('Error fetching default branch:', error);
      throw new Error('Failed to fetch default branch for the repository.');
    }
  };
  
// Utility to check if a string is a valid semantic version
const isValidSemver = (version: string): boolean => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    return semverRegex.test(version);
};

// Main function to fetch and process GitHub repo
export const fetchAndProcessGitHubRepo = async (githubURL: string): Promise<{ base64Content: string; packageJson: string }> => {
    try {
        // Get the default branch of the GitHub repository
        const defaultBranch = await fetchDefaultBranch(githubURL);

        // Construct the URL to download the zip file
        const zipURL = `${githubURL}/archive/refs/heads/${defaultBranch}.zip`;

        // Fetch the zip file from GitHub
        const response = await axios.get(zipURL, { responseType: 'arraybuffer' });
        const base64Content = Buffer.from(response.data).toString('base64');

        // Extract the zip file
        const zip = new AdmZip(response.data);
        const zipEntries = zip.getEntries();

        // Look for package.json in all entries
        const packageJsonEntry = zipEntries.find((entry) => entry.entryName.endsWith('/package.json'));

        if (!packageJsonEntry) {
            throw new Error('package.json not found in the repository.');
        }

        const packageJson = packageJsonEntry.getData().toString('utf8');

        // Return the Base64 zip content and the extracted package.json
        return { base64Content, packageJson };
    } catch (error) {
        console.error('Error fetching and processing GitHub repository:', error);
        throw new Error('Failed to fetch and process GitHub repository.');
    }
};

export const toBase64 = (data: Buffer): string => {
    return Buffer.from(data).toString('base64');
};
  
export const extractPackageJsonInfo = (packageJson: string): { name: string; version: string; repositoryUrl?: string } => {
    try {
        const parsedJson = parse(packageJson);

        const name = parsedJson.name;
        const version = parsedJson.version;
        const repositoryUrl = parsedJson.repository?.url;

        return { name, version, repositoryUrl };
    } catch (error) {
        throw new Error('Invalid package.json format.');
    }
};

export const extractPackageJsonFromContent = async (base64Content: string): Promise<string> => {
    try {
        // Decode the Base64 content
        const buffer = Buffer.from(base64Content, 'base64');
        const zip = new AdmZip(buffer);

        // Get all entries in the zip file
        const zipEntries = zip.getEntries();

        // Look for package.json in all entries
        const packageJsonEntry = zipEntries.find((entry) => entry.entryName.endsWith('/package.json'));

        if (!packageJsonEntry) {
            throw new Error('package.json not found in the uploaded zip file.');
        }

        // Return the contents of package.json as a string
        return packageJsonEntry.getData().toString('utf8');
    } catch (error) {
        console.error('Error extracting package.json from content:', error);
        throw new Error('Failed to extract package.json from the uploaded content.');
    }
};

export const debloatPackageContent = async (content: string): Promise<string> => {
    // TODO: Implement tree shaking, minification, and other debloat techniques
    return content; // Currently returns unmodified content
};

function extractOwnerAndRepo(githubURL: string): { owner: string; repository: string } {
    const match = githubURL.match(/github\.com\/([^/]+)\/([^/]+)(\/|$)/);
    if (!match) {
        throw new Error('Invalid GitHub URL format.');
    }
    return { owner: match[1], repository: match[2] };
}

export async function calculateScores(githubURL: string): Promise<Record<string, any>> {
    try {
        // Extract owner and repository
        const { owner, repository } = extractOwnerAndRepo(githubURL);

        // Variables for latency calculations
        let start: number;
        let end: number;

        let netScoreStart: number;
        let netScoreEnd: number;

        netScoreStart = performance.now();

        // Get non-API metrics
        start = performance.now();
        const foundLicense: number = await getLicense(githubURL, repository);
        end = performance.now();
        const foundLicenseLatency = ((end - start) / 1000).toFixed(3);

        // Get repository interfaces to calculate metrics
        const repoIssues: RepositoryIssues = await fetchRepositoryIssues(owner, repository);
        const repoUsers: RepositoryUsers = await fetchRepositoryUsers(owner, repository);
        const repoDependencies: RepositoryDependencies = await fetchRepositoryDependencies(owner, repository);

        // Calculate individual metrics and their latencies
        start = performance.now();
        const busFactor = calculateBusFactorScore(repoUsers);
        end = performance.now();
        const busFactorLatency = ((end - start) / 1000).toFixed(3);

        start = performance.now();
        const correctness = calculateCorrectness(repoIssues);
        end = performance.now();
        const correctnessLatency = ((end - start) / 1000).toFixed(3);

        start = performance.now();
        const rampUp = calculateRampUpScore(repoUsers);
        end = performance.now();
        const rampUpLatency = ((end - start) / 1000).toFixed(3);

        start = performance.now();
        const responsiveMaintainer = calculateResponsiveMaintainerScore(repoIssues);
        end = performance.now();
        const responsiveMaintainerLatency = ((end - start) / 1000).toFixed(3);

        start = performance.now();
        const versionPinning = calculateVersionPinning(repoDependencies);
        end = performance.now();
        const versionPinningLatency = ((end - start) / 1000).toFixed(3);

        // Calculate net score
        const netScore = calculateNetScore(
            busFactor,
            correctness,
            responsiveMaintainer,
            rampUp,
            foundLicense,
            versionPinning
        );

        netScoreEnd = performance.now();
        const netScoreLatency = ((netScoreEnd - netScoreStart) / 1000).toFixed(3);

        // Return results as a dictionary
        return {
            NetScore: netScore,
            NetScore_Latency: netScoreLatency,
            RampUp: rampUp,
            RampUp_Latency: rampUpLatency,
            Correctness: correctness,
            Correctness_Latency: correctnessLatency,
            BusFactor: busFactor,
            BusFactor_Latency: busFactorLatency,
            ResponsiveMaintainer: responsiveMaintainer,
            ResponsiveMaintainer_Latency: responsiveMaintainerLatency,
            VersionPinning: versionPinning,
            VersionPinning_Latency: versionPinningLatency,
            License: foundLicense,
            License_Latency: foundLicenseLatency,
        };
    } catch (error) {
        console.error(`Error calculating scores for URL ${githubURL}:`, error);
        throw error;
    }
}

