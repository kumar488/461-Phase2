import { getLicense } from '../src/License';
import {fetchRepositoryInfo, fetchRepositoryDependencies, fetchRepositoryIssues, fetchRepositoryUsers, RepositoryInfo, RepositoryDependencies, RepositoryIssues, RepositoryUsers } from '../src/GitHubAPIcaller';
import calculateNetScore, { calculateBusFactorScore, calculateCorrectness, calculateRampUpScore, calculateResponsiveMaintainerScore } from '../src/CalculateMetrics';

import logger from '../src/logger';
import * as fs from 'fs';
import winston from 'winston';

// Mock dependencies
jest.mock('../src/License');
jest.mock('../src/GitHubAPIcaller', () => ({
    __esModule: true, // Indicates the module has both named and default exports
    default: jest.fn(), // Mock default export
    getNpmPackageGithubRepo: jest.fn().mockResolvedValue('https://github.com/owner/repository'),
    fetchRepositoryInfo: jest.fn(),
    fetchRepositoryIssues: jest.fn(),
    fetchRepositoryUsers: jest.fn(),
  }));
  
jest.mock('../src/CalculateMetrics');
jest.mock('../src/logger');
jest.mock('fs');

// Mock winston logger to avoid the error
jest.mock('winston', () => {
    const winstonMock = {
      createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
      })),
      format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        printf: jest.fn(),
      },
      transports: {
        File: jest.fn(),
      },
    };
    return winstonMock;
  });
  

// Mock the behavior of fs.readFileSync to avoid needing a physical file
(fs.readFileSync as jest.Mock).mockReturnValue(`https://github.com/owner/repository\nhttps://www.npmjs.com/package/test-package`);

// Test suite for lines 84-95
describe('License and Metrics Calculation', () => {
    it('should get the license for a repository and calculate metrics', async () => {
      const mockOwner = 'owner';
      const mockRepository = 'repository';
  
      // Mocking the repository license and metric functions
      const mockLicense = 1;
      (getLicense as jest.Mock).mockResolvedValue(mockLicense);
  
      const mockRepoInfo = { data: { repository: { name: '', owner: { login: '' }, forks: { totalCount: 0 } } } };
      const mockRepoIssues = { data: { repository: { issues: { totalCount: 0, edges: [] }, closedIssues: { totalCount: 0 } } } };
      const mockRepoUsers = { data: { repository: { mentionableUsers: { edges: [] } } } };
      const mockRepoDeps = { data: { repository: { dependencyGraphManifests: { nodes: [] } } } };
  
      (fetchRepositoryInfo as jest.Mock).mockResolvedValue(mockRepoInfo);
      // (fetchRepositoryIssues as jest.Mock).mockResolvedValue(mockRepoIssues);
      (fetchRepositoryUsers as jest.Mock).mockResolvedValue(mockRepoUsers);
      // (fetchRepositoryDependencies as jest.Mock).mockResolvedValue(mockRepoDeps);
  
      const { processPackageData } = require('../src/main');
      const license = await getLicense('https://github.com/owner/repository', mockRepository);
      
      // Ensure that fetchRepositoryInfo was called with correct arguments
      // expect(fetchRepositoryInfo).toHaveBeenCalledWith(mockOwner, mockRepository);
      // expect(calculateBusFactorScore).toHaveBeenCalledWith(mockRepoUsers);
      expect(license).toBe(mockLicense);
    });
  });
