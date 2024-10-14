import calculateNetScore, { calculateBusFactorScore, calculateCorrectness, calculateRampUpScore, calculateResponsiveMaintainerScore } from '../src/CalculateMetrics';

import fetchRepositoryInfo, { fetchRepositoryUsers, fetchRepositoryIssues,
  RepositoryInfo, RepositoryIssues, RepositoryUsers,
  getNpmPackageGithubRepo
} from '../src//GitHubAPIcaller';

  let repoIssues: RepositoryIssues;
  let repoUsers: RepositoryUsers;
  let foundLicense: number;
  let busFactorScore: number;
  let correctnessScore: number;
  let rampUpScore: number;
  let responsiveMaintainerScore: number;
  let netScore: number;

beforeAll(async () => {
  repoIssues = await fetchRepositoryIssues("cloudinary", "cloudinary_npm");
  repoUsers = await fetchRepositoryUsers("cloudinary", "cloudinary_npm");
  foundLicense = 1;

  busFactorScore = calculateBusFactorScore(repoUsers);
  correctnessScore = calculateCorrectness(repoIssues);
  rampUpScore = calculateRampUpScore(repoUsers);
  responsiveMaintainerScore = calculateResponsiveMaintainerScore(repoIssues);
  netScore = calculateNetScore(busFactorScore, correctnessScore, responsiveMaintainerScore, rampUpScore, foundLicense);
});

it('should calculate the correct bus factor score', () => {
  expect(busFactorScore).toBeCloseTo(0.2);
});

it('should calculate the correct correctness score', () => {
  expect(correctnessScore).toBeCloseTo(1, 1);
});

it('should calculate the correct ramp-up score', () => {
  expect(rampUpScore).toBeGreaterThanOrEqual(0.1);
  expect(rampUpScore).toBeLessThanOrEqual(0.5);
});

it('should calculate the correct responsive maintainer score', () => {
  expect(responsiveMaintainerScore).toBeGreaterThanOrEqual(0.5);
  expect(responsiveMaintainerScore).toBeLessThanOrEqual(1);
});

it('should calculate the correct license score', () => {
  expect(foundLicense == 1);
});

it('should calculate the correct net score', () => {
  expect(netScore).toBeGreaterThanOrEqual(0.25);
  expect(netScore).toBeLessThanOrEqual(0.75);
});