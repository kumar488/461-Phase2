"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getLicense = getLicense;
const fs = __importStar(require("fs"));
const git = __importStar(require("isomorphic-git"));
const node_1 = __importDefault(require("isomorphic-git/http/node"));
const path = __importStar(require("path"));
const logger_1 = __importDefault(require("./logger"));
// List of licenses compatible with LGPLv2.1
const compatibleLicenses = ["MIT", "BSD-2-Clause", "BSD-3-Clause", "Apache-2.0", "MPL-2.0"];
function getLicense(url, repository) {
    return __awaiter(this, void 0, void 0, function* () {
        const cloneDir = path.join('./clonedGitRepos', repository);
        try {
            // Create the clonedGitRepos folder if it doesn't exist
            if (!fs.existsSync('./clonedGitRepos')) {
                fs.mkdirSync('./clonedGitRepos', { recursive: true });
            }
            logger_1.default.info(`Cloning repository ${repository}...`);
            // Clone the repository with depth=1 to get only the most recent commit
            yield git.clone({
                fs,
                http: node_1.default,
                dir: cloneDir,
                url: url,
                singleBranch: true,
                depth: 1
            });
            // Search for LICENSE file
            const files = fs.readdirSync(cloneDir);
            const foundLicense = files.find(file => /LICENSE(\..*)?$/i.test(file));
            let foundReadme = false;
            let licenseType = null;
            if (foundLicense != undefined) {
                // Read the contents of the LICENSE file
                const licenseContent = fs.readFileSync(path.join(cloneDir, foundLicense), 'utf8');
                licenseType = identifyLicenseType(licenseContent); // Function to identify license type
            }
            else {
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
            }
            else if (foundLicense || foundReadme) {
                return 0; // License found but not compatible
            }
            else {
                return -1; // License not found
            }
        }
        catch (err) { // Error case
            logger_1.default.error('Error in cloning or searching for license:', err);
            return -1;
        }
    });
}
// Identify the license type based on the content
function identifyLicenseType(content) {
    if (content.includes("MIT License")) {
        return "MIT";
    }
    else if (content.includes("BSD-2-Clause")) {
        return "BSD-2-Clause";
    }
    else if (content.includes("BSD-3-Clause")) {
        return "BSD-3-Clause";
    }
    else if (content.includes("Apache License")) {
        return "Apache-2.0";
    }
    else if (content.includes("Mozilla Public License")) {
        return "MPL-2.0";
    }
    else {
        return null; // License type not identified
    }
}
//# sourceMappingURL=License.js.map