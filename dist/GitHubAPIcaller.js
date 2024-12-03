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
exports.fetchRepositoryInfo = fetchRepositoryInfo;
exports.fetchRepositoryIssues = fetchRepositoryIssues;
exports.fetchRepositoryUsers = fetchRepositoryUsers;
exports.fetchRepositoryDependencies = fetchRepositoryDependencies;
exports.getNpmPackageGithubRepo = getNpmPackageGithubRepo;
const dotenv = __importStar(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
// stuff to grab token from .env file
dotenv.config();
const TOKEN = process.env.GITHUB_TOKEN;
// GraphQl endpoint
const GITHUB_API_URL = 'https://api.github.com/graphql';
/////// GraphQL API calls for different information ///////
// function to call API for basic repo information
function fetchRepositoryInfo(owner, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    query {
      repository(owner: "${owner}", name: "${name}") {
        name
        owner {
          login
        }
        forks {
          totalCount
        }
      }
    }
  `;
        const response = yield fetch(GITHUB_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result = yield response.json();
        return result;
    });
}
// function to call API for issue repo information
function fetchRepositoryIssues(owner, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
  query {
    repository(owner: "${owner}", name: "${name}") {
        issues(last: 50) {
            totalCount
            edges {
                node {
                    title
                    createdAt
                    closedAt
                }
            }
        }
        closedIssues: issues(states: CLOSED) {
          totalCount
        }
      }
    }
  `;
        const response = yield fetch(GITHUB_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result = yield response.json();
        return result;
    });
}
// function to call API for user repo information
function fetchRepositoryUsers(owner, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    query {
      repository(owner: "${owner}", name: "${name}") {
        mentionableUsers(first: 10) {
          edges {
            node {
              login
              url
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                }
                commitContributionsByRepository {
                  contributions(first: 1) { 
                    edges {
                      node {
                        occurredAt
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
        const response = yield fetch(GITHUB_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result = yield response.json();
        return result;
    });
}
function fetchRepositoryDependencies(owner, name) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    query {
      repository(owner: "${owner}", name: "${name}") {
        dependencyGraphManifests(first: 1) {
          totalCount
          nodes {
            dependencies(first: 100) {
              totalCount
              nodes {
                packageName
                requirements
              }
            }
          }
        }
      }
    }
  `;
        const response = yield fetch(GITHUB_API_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const result = yield response.json();
        return result;
    });
}
/**
 * Fetches NPM package details from the NPM registry and extracts the GitHub repository URL.
 * @param packageName - The name of the NPM package to query.
 * @returns The GitHub repository URL if available, otherwise null.
 */
function getNpmPackageGithubRepo(packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(`https://registry.npmjs.org/${packageName}`);
            const packageData = response.data;
            if (packageData.repository && packageData.repository.url) {
                let repoUrl = packageData.repository.url;
                if (repoUrl.startsWith('git+ssh://git@')) {
                    repoUrl = repoUrl.replace('git+ssh://git@', 'https://').replace('.git', '');
                }
                else if (repoUrl.startsWith('git+')) {
                    repoUrl = repoUrl.replace('git+', '').replace('.git', '');
                }
                else {
                    repoUrl = repoUrl.replace('.git', ''); // Always remove `.git` suffix
                }
                if (repoUrl.includes('github.com')) {
                    return repoUrl;
                }
            }
            return null;
        }
        catch (error) {
            console.error(`Failed to fetch NPM package data for ${packageName}:`, error);
            return null;
        }
    });
}
//# sourceMappingURL=GitHubAPIcaller.js.map