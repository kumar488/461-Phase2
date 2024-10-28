import {fetchRepositoryInfo, fetchRepositoryUsers, fetchRepositoryIssues,
  RepositoryInfo, RepositoryIssues, RepositoryUsers, fetchRepositoryDependencies, RepositoryDependencies
} from './GitHubAPIcaller';

export function calculateBusFactorScore(users: RepositoryUsers): number {
  // get total contributions for each user
  const contributions = users.data.repository.mentionableUsers.edges.map(
    (user) => user.node.contributionsCollection.contributionCalendar.totalContributions
  );

  // get total contributions by everyone
  const totalContributions = contributions.reduce((acc, val) => acc + val, 0);

  // total number users
  const totalUsers = contributions.length;

  // average contribution per person
  const averageContribution = totalContributions / totalUsers;

  // get number of users with contributions >= average contributions per person
  const aboveAverageContributors = contributions.filter(
    (contribution) => contribution >= averageContribution
  ).length;

  const busFactorScore = aboveAverageContributors / totalUsers;

  // round to the nearest hundredth
  return Math.round(busFactorScore * 100) / 100;
}

export function calculateCorrectness(issues: RepositoryIssues): number {
  const totalIssues = issues.data.repository.issues.totalCount;
  const completedIssues = issues.data.repository.closedIssues.totalCount;

  if(totalIssues === 0) {
    return 1;
  }

  const correctness = completedIssues / totalIssues;

  // round to the nearest hundredth
  return Math.round(correctness * 100) / 100;
}

export function calculateRampUpScore(users: RepositoryUsers): number {
  // get first contribution date for each user (from ChatGPT)
  const firstContributionDates: number[] = users.data.repository.mentionableUsers.edges
    .map((user) => {
      const contributionDates = user.node.contributionsCollection.commitContributionsByRepository.flatMap((repo) =>
        repo.contributions.edges.map((contribution) => new Date(contribution.node.occurredAt).getTime())
      );
      return contributionDates.length ? Math.min(...contributionDates) : null;
    })
    .filter((date) => date !== null) as number[];

  // if no valid contribution dates, return 0 as the score.
  // need at least two contributors to calculate the average  
  if(firstContributionDates.length < 2) {    
    return 0;
  }

  // find the time differences between contributors (in months) 
  const timeDifferences: number[] = [];
  for(let i = 1; i < firstContributionDates.length; i++) {
    const diffInWeeks = (firstContributionDates[i] - firstContributionDates[i - 1]) / (1000 * 3600 * 24 * 30);
    timeDifferences.push(Math.abs(diffInWeeks)); // make sure all differences are positive
  }

  // find average (in months)
  const averageTimeDifference = timeDifferences.reduce((acc, val) => acc + val, 0) / timeDifferences.length;

  // handle edge cases where the averageTimeDifference is 0 or too small
  if (averageTimeDifference <= 0) {
    return 1; // if the time difference is 0, return max score
  }

  // calculate ramp-up score and normalize to between 0 and 1
  const rampUpScore = Math.min(1 / averageTimeDifference, 1);

  // round to the nearest hundredth
  return Math.round(rampUpScore * 100) / 100;
}

export function calculateResponsiveMaintainerScore(issues: RepositoryIssues): number {
  // get date one month ago from today
  const currentDate = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(currentDate.getMonth() - 1); // set for one month ago

  // get issue creation and closed dates from past month (from ChatGPT)
  const recentIssues = issues.data.repository.issues.edges.filter((issue) => {
    const createdAt = new Date(issue.node.createdAt);
    return createdAt >= oneMonthAgo;
  });

  // get total number of issues created within the past month
  const totalIssues = recentIssues.length;

  // get number of resolved issues within the past month
  const resolvedIssues = recentIssues.filter((issue) => issue.node.closedAt !== null).length;

  // if no issues were created in the past month
  if(totalIssues === 0) {
    return 0;
  }

  const responsiveMaintainer = resolvedIssues / totalIssues;

  // round to the nearest hundredth
  return Math.round(responsiveMaintainer * 100) / 100;
}

export function calculateVersionPinning(dependencies: RepositoryDependencies): number {
  const totalDependencies = dependencies.data.repository.dependencyGraphManifests.totalCount;
  const pinnedDependencies = dependencies.data.repository.dependencyGraphManifests.nodes.filter(
    (manifest) => manifest.dependencies.nodes.some((dependency) => dependency.requirements !== null)
  ).length;

  if(totalDependencies === 0) {
    return 1;
  }

  const versionPinningScore = pinnedDependencies / totalDependencies;

  // round to the nearest hundredth
  return Math.round(versionPinningScore * 100) / 100;
}

export default function calculateNetScore(busFactor: number, correctness: number, responsiveMaintainer: number,
                                          rampUp: number, licenseScore: number, versionPinning: number): number {
  const netScore = licenseScore * ((0.2 * busFactor) + (0.25 * correctness) + (0.35 * responsiveMaintainer) + (0.1 * rampUp) + (0.1 * versionPinning));

// round to nearest hundredth
return Math.round(netScore * 100) / 100;
}