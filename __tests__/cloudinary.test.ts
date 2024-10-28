import calculateNetScore, { calculateBusFactorScore, calculateCorrectness, calculateRampUpScore, calculateResponsiveMaintainerScore, calculateVersionPinning } from '../src/CalculateMetrics';

import { fetchRepositoryInfo, fetchRepositoryUsers, fetchRepositoryIssues, fetchRepositoryDependencies,
  RepositoryInfo, RepositoryIssues, RepositoryUsers, RepositoryDependencies,
  getNpmPackageGithubRepo
} from '../src//GitHubAPIcaller';

let repoIssues: RepositoryIssues;
let repoUsers: RepositoryUsers;
let repoDeps: RepositoryDependencies;
let foundLicense: number;
let busFactorScore: number;
let correctnessScore: number;
let rampUpScore: number;
let responsiveMaintainerScore: number;
let versionPinningScore: number;
let netScore: number;

beforeAll(async () => {
  repoIssues = await fetchRepositoryIssues("cloudinary", "cloudinary_npm");
  repoUsers = await fetchRepositoryUsers("cloudinary", "cloudinary_npm");
  repoDeps = await fetchRepositoryDependencies("cloudinary", "cloudinary_npm");
  foundLicense = 1;

  busFactorScore = calculateBusFactorScore(repoUsers);
  correctnessScore = calculateCorrectness(repoIssues);
  rampUpScore = calculateRampUpScore(repoUsers);
  responsiveMaintainerScore = calculateResponsiveMaintainerScore(repoIssues);
  versionPinningScore = calculateVersionPinning(repoDeps);
  netScore = calculateNetScore(busFactorScore, correctnessScore, responsiveMaintainerScore, rampUpScore, foundLicense, versionPinningScore);
});

it('should calculate the correct bus factor score', () => {
  expect(busFactorScore).toBeCloseTo(0.2);
});

it('should calculate the correct correctness score', () => {
  expect(correctnessScore).toBeGreaterThanOrEqual(0.9);
});

it('should calculate the correct ramp-up score', () => {
  expect(rampUpScore).toBeGreaterThanOrEqual(0.1);
  expect(rampUpScore).toBeLessThanOrEqual(0.5);
});

it('should calculate the correct responsive maintainer score', () => {
  expect(responsiveMaintainerScore).toBeGreaterThanOrEqual(0);
  expect(responsiveMaintainerScore).toBeLessThanOrEqual(1);
});

it('should calculate the correct license score', () => {
  expect(foundLicense == 1);
});

it('should calculate the correct version pinning score', () => {
  expect(versionPinningScore).toBeCloseTo(0.33, 1);
});

it('should calculate the correct net score', () => {
  expect(netScore).toBeGreaterThanOrEqual(0.25);
  expect(netScore).toBeLessThanOrEqual(0.75);
});