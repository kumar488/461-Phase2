import { getNpmPackageGithubRepo } from '../src/GitHubAPIcaller';
import axios from 'axios';

jest.mock('axios');

describe('GitHubAPIcaller tests', () => {
  let spyConsoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
    spyConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {}); // Mock console.error to suppress logs
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original console.error after tests
  });

  it('should return GitHub repo URL for a valid package', async () => {
    const mockNpmData = {
      repository: {
        url: 'https://github.com/test-user/test-repo',
      },
    };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockNpmData });

    const result = await getNpmPackageGithubRepo('test-package');
    expect(result).toBe('https://github.com/test-user/test-repo');
  });

  it('should return null if no GitHub repo found', async () => {
    const mockNpmData = {
      repository: {
        url: 'https://bitbucket.org/test-user/test-repo',
      },
    };
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: mockNpmData });

    const result = await getNpmPackageGithubRepo('test-package');
    expect(result).toBeNull();
  });

  it('should log an error and return null if the NPM API fails', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('NPM API is down'));

    const result = await getNpmPackageGithubRepo('nonexistent-package');
    expect(result).toBeNull();

    // Ensure that console.error was called with the correct message
    expect(spyConsoleError).toHaveBeenCalledWith(
      'Failed to fetch NPM package data for nonexistent-package:',
      expect.any(Error)
    );
  });
});
