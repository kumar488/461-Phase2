#!/usr/bin/env node 
//got above line from ChatGPT REF: [1]
import * as fs from 'fs';

// import logger
import logger from './logger'; 

const logFile = process.env.LOG_FILE;
const githubToken = process.env.GITHUB_TOKEN;

// Exit with an error code if the required environment variables are not set
if (logFile == "" || githubToken == "") {
  logger.error("Error: LOG_FILE or GITHUB_TOKEN environment variable is not set.");
  process.exit(1); // Exit unsuccessfully
}
else
{
  logger.info("LOG_FILE and GITHUB_TOKEN environment variables are set.");
}

logger.info("Getting URLs...");
//get the input from ./run {input}
let input_args: string[] = process.argv.slice(2); //gets user arguments pass in from run bash script REF: [2]
let filepath: string = input_args.length > 0 ? input_args[0] : "test"; //if no mode is passed in, default to test

// Read the URLs from the given filepath
const url_file = fs.readFileSync(filepath, 'utf-8'); // Import file

// Split the URLs, trim whitespace, and filter out any empty lines
const urls = url_file
  .split('\n')
  .map(url => url.trim())
  .filter(url => url.length > 0); // Filter out blank lines

// import fetch/print functions and interfaces
import calculateNetScore, { calculateBusFactorScore, calculateCorrectness,
                            calculateRampUpScore, calculateResponsiveMaintainerScore,
                            calculateVersionPinning
                          } from './CalculateMetrics';

import  { fetchRepositoryInfo, fetchRepositoryUsers, fetchRepositoryIssues,
          RepositoryInfo, RepositoryIssues, RepositoryUsers,
          getNpmPackageGithubRepo, fetchRepositoryDependencies,
          RepositoryDependencies
        } from './GitHubAPIcaller';                          

import { getLicense } from './License';

// Get the GitHub repository URL for a given NPM package
export async function processPackageData(packageName: string): Promise<string> {
  const githubRepo = await getNpmPackageGithubRepo(packageName);
  
  if (githubRepo) {
      // Return the GitHub repository URL
      return githubRepo;
  } else {
      logger.error(`No GitHub repository found for ${packageName}`);
      // exit(1);
      //**LOGGING - we need better log here
      return "";
  }
}
logger.info("Processing URLs...");
for( let i = 0; i < urls.length; i++){ //loop through all of the urls
  (async () => {
    try {//Get data from url
      let link_split = urls[i].split("/"); //splits each url into different parts

      let owner : string;
      let repository : string;

      owner = "";
      repository = "";

      if( link_split[2] === "github.com" ){ //if its github we can just use owner repository from url
        owner = link_split[3];
        repository = link_split[4].replace(".git", "");
      }
      
      else if( link_split[2] === "www.npmjs.com" ){
        //whatever our get link for npm will be (hard coding with working test case for now)
        const githubRepoOut = await processPackageData(link_split[4]);
        urls[i] = githubRepoOut; //fix for license

        let link_split_npm = githubRepoOut.split("/"); //splits each url into different parts

        owner = link_split_npm[3];
        repository = link_split_npm[4].replace(".git", "");
      }
      else{
        logger.error("URL is not a valid GitHub or NPM URL");
      }
      
      //variables for latency calculations
      let start : number;
      let end : number;

      let netScoreStart : number;
      let netScoreEnd : number;

      netScoreStart = performance.now();

      //get non-api metrics
      start = performance.now();
      const foundLicense: number = await getLicense(urls[i], repository);
      end = performance.now();
      const foundLicenseLatency = ((end - start) / 1000).toFixed(3);

      // get inferfaces to get all metrics for repository information
      const repoIssues: RepositoryIssues = await fetchRepositoryIssues(owner, repository);
      const repoUsers:  RepositoryUsers  = await fetchRepositoryUsers(owner, repository);
      const repoDependencies: RepositoryDependencies = await fetchRepositoryDependencies(owner, repository);

      // API metric calculations
      //bus factor
      start = performance.now();
      const busFactor           = calculateBusFactorScore(repoUsers);
      end = performance.now();
      const busFactorLatency    = ((end - start) / 1000).toFixed(3);
      
      //correctness
      start = performance.now();
      const correctness         = calculateCorrectness(repoIssues);
      end = performance.now();
      const correctnessLatency  = ((end - start) / 1000).toFixed(3);

      //ramp up
      start = performance.now();
      const rampUp              = calculateRampUpScore(repoUsers);
      end = performance.now();
      const rampUpLatency       = ((end - start) / 1000).toFixed(3);

      //responsive maintainer
      start = performance.now();
      const responsiveMaintainer = calculateResponsiveMaintainerScore(repoIssues);
      end = performance.now();
      const responsiveMaintainerLatency = ((end - start) / 1000).toFixed(3);

      //version pinning
      start = performance.now();
      const versionPinning = calculateVersionPinning(repoDependencies);
      end = performance.now();
      const versionPinningLatency = ((end - start) / 1000).toFixed(3);

      //net score
      const netScore = calculateNetScore(busFactor, correctness, responsiveMaintainer, rampUp, foundLicense, versionPinning);

      netScoreEnd = performance.now();

      const netScoreLatency = ((netScoreEnd - netScoreStart) / 1000).toFixed(3);

      // Assuming each variable is defined correctly for each URL
      var output_string = `{"URL":"${urls[i]}", "NetScore":${netScore}, "NetScore_Latency": ${netScoreLatency}, "RampUp":${rampUp}, "RampUp_Latency": ${rampUpLatency}, "Correctness":${correctness}, "Correctness_Latency":${correctnessLatency}, "BusFactor":${busFactor}, "BusFactor_Latency": ${busFactorLatency}, "ResponsiveMaintainer":${responsiveMaintainer}, "ResponsiveMaintainer_Latency": ${responsiveMaintainerLatency}, "VersionPinning": ${versionPinning}, "VersionPinning_Latency": ${versionPinningLatency}, "License":${foundLicense}, "License_Latency": ${foundLicenseLatency}}`;
      
      logger.info("Generating JSON output for URL: " + urls[i]);
      // Only write the JSON object followed by a newline
      logger.info(`netScore: ${netScore}\nrampUp: ${rampUp}\ncorrectness: ${correctness}\nbusFactor: ${busFactor}\nresponsiveMaintainer: ${responsiveMaintainer}\nversionPinning: ${versionPinning}\nfoundLicense: ${foundLicense}`);
      process.stdout.write(output_string + '\n');

  } 
  catch (error) {
    logger.error('Error:', error); 
  }
  })();
  
}
export async function getRepositoryRating(url: string): Promise<string> {
  try {
    let link_split = url.split("/");

    let owner: string = "";
    let repository: string = "";

    if (link_split[2] === "github.com") {
      owner = link_split[3];
      repository = link_split[4].replace(".git", "");
    } else if (link_split[2] === "www.npmjs.com") {
      const githubRepoOut = await processPackageData(link_split[4]);
      url = githubRepoOut;

      let link_split_npm = githubRepoOut.split("/");
      owner = link_split_npm[3];
      repository = link_split_npm[4].replace(".git", "");
    } else {
      logger.error("URL is not a valid GitHub or NPM URL");
      return "";
    }

    let start: number;
    let end: number;

    let netScoreStart: number = performance.now();

    start = performance.now();
    const foundLicense: number = await getLicense(url, repository);
    end = performance.now();
    const foundLicenseLatency = ((end - start) / 1000).toFixed(3);

    const repoIssues: RepositoryIssues = await fetchRepositoryIssues(owner, repository);
    const repoUsers: RepositoryUsers = await fetchRepositoryUsers(owner, repository);
    const repoDependencies: RepositoryDependencies = await fetchRepositoryDependencies(owner, repository);

    start = performance.now();
    const busFactor = calculateBusFactorScore(repoUsers);
    end = performance.now();
    const busFactorLatency = ((end - start) / 1000).toFixed(3);

    start = performance.now();
    const correctness = calculateCorrectness(repoIssues);
    end = performance.now();
    const correctnessLatency = ((end - start) / 1000).toFixed(3);

    start = performance.now();
    const rampUp = calculateRampUpScore(repoUsers);
    end = performance.now();
    const rampUpLatency = ((end - start) / 1000).toFixed(3);

    start = performance.now();
    const responsiveMaintainer = calculateResponsiveMaintainerScore(repoIssues);
    end = performance.now();
    const responsiveMaintainerLatency = ((end - start) / 1000).toFixed(3);

    start = performance.now();
    const versionPinning = calculateVersionPinning(repoDependencies);
    end = performance.now();
    const versionPinningLatency = ((end - start) / 1000).toFixed(3);

    const netScore = calculateNetScore(busFactor, correctness, responsiveMaintainer, rampUp, foundLicense, versionPinning);
    let netScoreEnd: number = performance.now();
    const netScoreLatency = ((netScoreEnd - netScoreStart) / 1000).toFixed(3);

    const output_string = `{"URL":"${url}", "NetScore":${netScore}, "NetScore_Latency": ${netScoreLatency}, "RampUp":${rampUp}, "RampUp_Latency": ${rampUpLatency}, "Correctness":${correctness}, "Correctness_Latency":${correctnessLatency}, "BusFactor":${busFactor}, "BusFactor_Latency": ${busFactorLatency}, "ResponsiveMaintainer":${responsiveMaintainer}, "ResponsiveMaintainer_Latency": ${responsiveMaintainerLatency}, "VersionPinning": ${versionPinning}, "VersionPinning_Latency": ${versionPinningLatency}, "License":${foundLicense}, "License_Latency": ${foundLicenseLatency}}`;

    return output_string;
  } catch (error) {
    logger.error('Error:', error);
    return "";
  }
}