import * as dotenv from 'dotenv';
import axios from 'axios';

// stuff to grab token from .env file
dotenv.config();
const TOKEN = process.env.GITHUB_TOKEN;

// GraphQl endpoint
const GITHUB_API_URL = 'https://api.github.com/graphql';

/////// structures for different interfaces ///////
export interface RepositoryInfo {
  data: {
    repository: {
      name: string;
      owner: {
        login: string;
      };
      forks: {
        totalCount: number;
      };
    };
  };
}

export interface RepositoryIssues {
  data: {
    repository: {
      issues: {
        totalCount: number;
        edges: Array<{
          node: {
            title: string;
            createdAt: string;
            closedAt: string | null; // null if issue is still open
          };
        }>;
      };
      closedIssues: {
        totalCount: number;
      };
    };
  };
}

export interface RepositoryUsers {
  data: {
    repository: {
      mentionableUsers: {
        edges: Array<{
          node: {
            login: string;
            url: string;
            contributionsCollection: {
              contributionCalendar: {
                totalContributions: number;
              };
              commitContributionsByRepository: Array<{
                contributions: {
                  edges: Array<{
                    node: {
                      occurredAt: string; 
                    };
                  }>;
                };
              }>;
            };
          };
        }>;
      };
    };
  };
}

export interface RepositoryDependencies {
  data: {
    repository: {
      dependencyGraphManifests: {
        totalCount: number;
        nodes: Array<{
          dependencies: {
            totalCount: number;
            nodes: Array<{
              packageName: string;
              requirements: string;
            }>;
          };
        }>;
      };
    }
  }
}

/////// GraphQL API calls for different information ///////

// function to call API for basic repo information
export async function fetchRepositoryInfo(owner: string, name: string): Promise<RepositoryInfo> {
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

  const response = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if(!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const result: RepositoryInfo = await response.json();
  
  return result;
}

// function to call API for issue repo information
export async function fetchRepositoryIssues(owner: string, name: string): Promise<RepositoryIssues> {
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
  const response = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if(!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const result: RepositoryIssues = await response.json();
  
  return result;
}

// function to call API for user repo information
export async function fetchRepositoryUsers(owner: string, name: string): Promise<RepositoryUsers> {
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

  const response = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if(!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const result: RepositoryUsers = await response.json();
  
  return result;
}

export async function fetchRepositoryDependencies(owner: string, name: string): Promise<RepositoryDependencies> {
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

  const response = await fetch(GITHUB_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if(!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  const result: RepositoryDependencies = await response.json();
  
  return result;
}

/**
 * Fetches NPM package details from the NPM registry and extracts the GitHub repository URL.
 * @param packageName - The name of the NPM package to query.
 * @returns The GitHub repository URL if available, otherwise null.
 */
export async function getNpmPackageGithubRepo(packageName: string): Promise<string | null> {
  try {
      const response = await axios.get(`https://registry.npmjs.org/${packageName}`);
      const packageData = response.data;

      if (packageData.repository && packageData.repository.url) {
          let repoUrl = packageData.repository.url;

          if (repoUrl.startsWith('git+ssh://git@')) {
              repoUrl = repoUrl.replace('git+ssh://git@', 'https://').replace('.git', '');
          } else if (repoUrl.startsWith('git+')) {
              repoUrl = repoUrl.replace('git+', '').replace('.git', '');
          } else {
              repoUrl = repoUrl.replace('.git', ''); // Always remove `.git` suffix
          }

          if (repoUrl.includes('github.com')) {
              return repoUrl;
          }
      }

      return null;
  } catch (error) {
      console.error(`Failed to fetch NPM package data for ${packageName}:`, error);
      return null;
  }
}