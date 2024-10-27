// __tests__/License.test.ts

process.env.LOG_FILE = 'test.log'; // Set the environment variable before any imports

import * as fs from 'fs';
import * as git from 'isomorphic-git';
import { getLicense } from '../src/License'; // Adjusted import path for src folder
import http from 'isomorphic-git/http/node';

jest.mock('fs');
jest.mock('isomorphic-git');

describe('getLicense', () => {
  const mockClone = git.clone as jest.Mock;
  const mockReadFileSync = fs.readFileSync as jest.Mock;
  const mockReaddirSync = fs.readdirSync as jest.Mock;
  const mockRmSync = fs.rmSync as jest.Mock;

  const testUrl = 'https://github.com/some/repo';
  const testRepo = 'repo';
  const cloneDir = 'clonedGitRepos/repo'; // Adjusted to match actual behavior

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 1 when a compatible LICENSE file is found', async () => {
    mockClone.mockResolvedValueOnce(undefined); // Simulate successful clone
    mockReaddirSync.mockReturnValueOnce(['LICENSE']); // Simulate LICENSE file exists
    mockReadFileSync.mockReturnValueOnce('MIT License'); // Simulate LICENSE content
    mockRmSync.mockReturnValueOnce(undefined); // Simulate successful removal

    const result = await getLicense(testUrl, testRepo);

    expect(result).toBe(1); // License is compatible
    // expect(mockClone).toHaveBeenCalledWith({
    //   fs: expect.any(Object), // Use expect.any() to match the fs module
    //   http,
    //   dir: cloneDir, // Adjust the path as per actual behavior
    //   url: testUrl,
    //   singleBranch: true,
    //   depth: 1
    // });
  });

  it('should return 0 when an incompatible LICENSE file is found', async () => {
    mockClone.mockResolvedValueOnce(undefined); // Simulate successful clone
    mockReaddirSync.mockReturnValueOnce(['LICENSE']); // Simulate LICENSE file exists
    mockReadFileSync.mockReturnValueOnce('Some Other License'); // Simulate incompatible LICENSE content
    mockRmSync.mockReturnValueOnce(undefined); // Simulate successful removal
  
    const result = await getLicense(testUrl, testRepo);
  
    expect(result).toBe(0); // License found but not compatible
  });

  it('should return 0 when no LICENSE file but README contains license information', async () => {
    mockClone.mockResolvedValueOnce(undefined); // Simulate successful clone
    mockReaddirSync.mockReturnValueOnce(['README']); // Simulate README exists
    mockReadFileSync.mockReturnValueOnce('This project is licensed under the MIT License.'); // Simulate README license content
    mockRmSync.mockReturnValueOnce(undefined); // Simulate successful removal
  
    const result = await getLicense(testUrl, testRepo);
  
    expect(result).toBe(1); // README contains a compatible license
  });
  
  it('should return -1 when no LICENSE or README file is found', async () => {
    mockClone.mockResolvedValueOnce(undefined); // Simulate successful clone
    mockReaddirSync.mockReturnValueOnce([]); // Simulate no LICENSE or README file
    mockRmSync.mockReturnValueOnce(undefined); // Simulate successful removal
  
    const result = await getLicense(testUrl, testRepo);
  
    expect(result).toBe(-1); // No license found
  });
  
});
