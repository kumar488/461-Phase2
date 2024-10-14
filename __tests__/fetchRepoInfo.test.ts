import fetchRepositoryInfo, { RepositoryInfo } from '../src//GitHubAPIcaller';

let repoInfo: RepositoryInfo;

beforeAll(async () => {
    repoInfo = await fetchRepositoryInfo("nullivex", "nodist");
});

it('should output correct repo name', () => {
    expect(repoInfo.data.repository.name).toBe("nodist");
});

it('should output correct owner name', () => {
    expect(repoInfo.data.repository.owner.login).toBe("nodists");
});

it('should output correct fork count', () => {
    // fork count might update after creating this test case
    expect(repoInfo.data.repository.forks.totalCount).toBeGreaterThanOrEqual(209);
});