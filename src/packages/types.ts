interface Package {
    metadata: PackageMetadata;
    data: PackageData;
  }
  
  interface PackageMetadata {
    Name: string;
    Version: string;
    ID: string;
  }
  
  interface PackageData {
    Name?: string;
    Content?: string;
    URL?: string;
    debloat?: boolean;
    JSProgram?: string;
  }
  
  interface User {
    name: string;
    isAdmin: boolean;
  }
  
  interface UserAuthenticationInfo {
    password: string;
  }
  
  interface PackageID {
    ID: string;
  }
  
  interface PackageCost {
    standaloneCost?: number;
    totalCost: number;
  }
  
  interface PackageRating {
    RampUp: number;
    Correctness: number;
    BusFactor: number;
    ResponsiveMaintainer: number;
    LicenseScore: number;
    GoodPinningPractice: number;
    PullRequest: number;
    NetScore: number;
  
    // Latency properties
    RampUpLatency: number;
    CorrectnessLatency: number;
    BusFactorLatency: number;
    ResponsiveMaintainerLatency: number;
    LicenseScoreLatency: number;
    GoodPinningPracticeLatency: number;
    PullRequestLatency: number;
    NetScoreLatency: number;
  }
  
  interface PackageHistoryEntry {
    User: User;
    Date: string; // ISO 8601 format
    PackageMetadata: PackageMetadata;
    Action: 'CREATE' | 'UPDATE' | 'DOWNLOAD' | 'RATE';
  }
  