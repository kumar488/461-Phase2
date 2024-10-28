import * as fs from 'fs';
import * as mainModule from '../src/main';
import logger from '../src/logger';
import { getLicense } from '../src/License';
import { fetchRepositoryInfo, fetchRepositoryIssues, fetchRepositoryUsers, fetchRepositoryDependencies } from '../src/GitHubAPIcaller';
import winston from 'winston';

// Mock external dependencies
jest.mock('fs');
jest.mock('../src/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
  }));
  
jest.mock('../src/License');
jest.mock('../src/GitHubAPIcaller', () => ({
    __esModule: true, 
    default: jest.fn(), 
    fetchRepositoryIssues: jest.fn(),
    fetchRepositoryUsers: jest.fn(),
  }));
  


// Mock Winston's File transport
jest.mock('winston', () => {
    const mLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    return {
      createLogger: jest.fn(() => mLogger),
      transports: {
        File: jest.fn()
      },
      format: {
        combine: jest.fn(),
        timestamp: jest.fn(),
        printf: jest.fn()
      }
    };
  });
  

// Mock environment variables
process.env.LOG_FILE = 'logfile.log';
process.env.GITHUB_TOKEN = 'token123';

describe('Main file tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should exit with code 1 if LOG_FILE or GITHUB_TOKEN is not set', () => {
    process.env.LOG_FILE = '';
    process.env.GITHUB_TOKEN = '';

    const mockExit = jest.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit(${code})`);
    });

    try {
      require('../src/main');
    } catch (e) {
      expect(mockExit).toHaveBeenCalledWith(1);
      expect(logger.error).toHaveBeenCalledWith("Error: LOG_FILE or GITHUB_TOKEN environment variable is not set.");
    } finally {
      mockExit.mockRestore();
    }
  });

  it('should log success when environment variables are set', () => {
    process.env.LOG_FILE = 'logfile.log';
    process.env.GITHUB_TOKEN = 'token123';

    jest.spyOn(fs, 'readFileSync').mockReturnValue('https://github.com/user/repo\n');

    require('../src/main');

    expect(logger.info).toHaveBeenCalledWith("LOG_FILE and GITHUB_TOKEN environment variables are set.");
    expect(logger.info).toHaveBeenCalledWith("Getting URLs...");
    expect(fs.readFileSync).toHaveBeenCalledWith('test', 'utf-8');
  });
  
  
});
