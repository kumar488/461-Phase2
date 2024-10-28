import {fetchRepositoryInfo, fetchRepositoryDependencies, RepositoryDependencies, RepositoryInfo} from '../src//GitHubAPIcaller';
let repoInfo: RepositoryInfo;
let repoDeps: RepositoryDependencies;

beforeAll(async () => {
    repoInfo = await fetchRepositoryInfo("nullivex", "nodist");
    repoDeps = await fetchRepositoryDependencies("nullivex", "nodist");
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
it('should output correct dependency count', () => {
    expect(repoDeps.data.repository.dependencyGraphManifests.nodes[0].dependencies.totalCount).toBeGreaterThanOrEqual(0);
});