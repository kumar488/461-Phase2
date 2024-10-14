import calculateNetScore, { calculateBusFactorScore, calculateCorrectness, calculateRampUpScore, calculateResponsiveMaintainerScore } from '../src/CalculateMetrics';

describe('CalculateMetrics functions', () => {
  // Mock data for RepositoryUsers and RepositoryIssues
  const mockRepositoryUsers = {
    data: {
      repository: {
        mentionableUsers: {
          edges: [
            {
              node: {
                login: 'user1',
                url: 'https://github.com/user1',
                contributionsCollection: {
                  contributionCalendar: {
                    totalContributions: 100
                  },
                  commitContributionsByRepository: [
                    {
                      contributions: {
                        edges: [
                          { node: { occurredAt: '2023-09-01T00:00:00Z' } },
                          { node: { occurredAt: '2023-08-01T00:00:00Z' } }
                        ]
                      }
                    }
                  ]
                }
              }
            },
            {
              node: {
                login: 'user2',
                url: 'https://github.com/user2',
                contributionsCollection: {
                  contributionCalendar: {
                    totalContributions: 200
                  },
                  commitContributionsByRepository: [
                    {
                      contributions: {
                        edges: [
                          { node: { occurredAt: '2023-09-10T00:00:00Z' } },
                          { node: { occurredAt: '2023-07-01T00:00:00Z' } }
                        ]
                      }
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    }
  };
  

  const mockRepositoryIssues = {
    data: {
      repository: {
        issues: {
          totalCount: 10,
          edges: [
            {
              node: {
                title: 'Issue 1',
                createdAt: new Date().toISOString(), // Created today
                closedAt: new Date().toISOString()    // Closed today
              }
            },
            {
              node: {
                title: 'Issue 2',
                createdAt: new Date().toISOString(),  // Created today
                closedAt: null                        // Still open
              }
            }
          ]
        },
        closedIssues: {
          totalCount: 5
        }
      }
    }
  };
  

  // Test for calculateBusFactorScore
  it('should calculate bus factor score correctly', () => {
    const busFactor = calculateBusFactorScore(mockRepositoryUsers);
    expect(busFactor).toBeCloseTo(0.5); // Expect 50% of users contributing above the average
  });

  // Test for calculateCorrectness
  it('should calculate correctness score correctly', () => {
    const correctness = calculateCorrectness(mockRepositoryIssues);
    expect(correctness).toBeCloseTo(0.5); // Expect 50% of issues completed
  });

  // Test for calculateRampUpScore
  it('should calculate ramp-up score correctly', () => {
    const rampUpScore = calculateRampUpScore(mockRepositoryUsers);
    expect(rampUpScore).toBeGreaterThanOrEqual(0); // Expect a non-negative score
    expect(rampUpScore).toBeLessThanOrEqual(1);    // Expect a score between 0 and 1
  });

  // Test for calculateResponsiveMaintainerScore
  it('should calculate responsive maintainer score correctly', () => {
    const responsiveMaintainer = calculateResponsiveMaintainerScore(mockRepositoryIssues);
    expect(responsiveMaintainer).toBeCloseTo(0.5, 2); // Expect 50% of issues resolved
  });

  // Test for calculateNetScore
  it('should calculate net score correctly', () => {
    const netScore = calculateNetScore(0.5, 0.5, 0.5, 0.5, 0.5);
    expect(netScore).toBeCloseTo(0.5); // Expect the weighted net score to be around 0.5
  });
});
