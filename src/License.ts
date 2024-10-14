import * as fs from 'fs';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import * as path from 'path';
import logger from './logger';

// List of licenses compatible with LGPLv2.1
const compatibleLicenses = ["MIT", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "MPL-2.0"];

export async function getLicense(url: string, repository: string): Promise<number> {
    const cloneDir = path.join('./clonedGitRepos', repository);

    try {
        // Create the clonedGitRepos folder if it doesn't exist
        if (!fs.existsSync('./clonedGitRepos')) {
            fs.mkdirSync('./clonedGitRepos', { recursive: true });
        }
        logger.info(`Cloning repository ${repository}...`);
        // Clone the repository with depth=1 to get only the most recent commit
        await git.clone({
            fs,
            http,
            dir: cloneDir,
            url: url,
            singleBranch: true,
            depth: 1
        });

        // Search for LICENSE file
        const files = fs.readdirSync(cloneDir);
        const foundLicense = files.find(file => /LICENSE(\..*)?$/i.test(file));
        let foundReadme : boolean = false; 
        let licenseType : string | null = null;

        if (foundLicense != undefined) {
            // Read the contents of the LICENSE file
            const licenseContent = fs.readFileSync(path.join(cloneDir, foundLicense), 'utf8');
            licenseType = identifyLicenseType(licenseContent); // Function to identify license type
        } else {
            const Readme = files.find(file => /README(\..*)?$/i.test(file));
            if (Readme != undefined) {
                // Read the contents of the README file
                const readme = fs.readFileSync(path.join(cloneDir, Readme), 'utf8');
                // Look for 'license' in the README file
                if (readme.toLowerCase().includes('license')) {
                    foundReadme = true;
                    licenseType = identifyLicenseType(readme); // Function to identify license type
                }
            } 
        }

        // Remove cloned repo
        fs.rmSync(cloneDir, { recursive: true, force: true });

        // Check if the identified license is compatible with LGPLv2.1
        if (licenseType && compatibleLicenses.includes(licenseType)) {
            return 1; // License is compatible
        } else if (foundLicense || foundReadme) {
            return 0; // License found but not compatible
        } else {
            return -1; // License not found
        }

    } catch (err) { // Error case
        logger.error('Error in cloning or searching for license:', err);
        return -1;
    }
}

// Identify the license type based on the content
function identifyLicenseType(content: string): string | null {
    if (content.includes("MIT License")) {
        return "MIT";
    } else if (content.includes("BSD-2-Clause")) {
        return "BSD-2-Clause";
    } else if (content.includes("BSD-3-Clause")) {
        return "BSD-3-Clause";
    } else if (content.includes("Apache License")) {
        return "Apache-2.0";
    } else if (content.includes("Mozilla Public License")) {
        return "MPL-2.0";
    } else {
        return null; // License type not identified
    }
}
