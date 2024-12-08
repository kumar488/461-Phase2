# ACME Corporation: A Trustworthy Module Registry

This project outlines a **Package Registry** tool and its **RESTful API** designed to help ACME Corporation engineers store, organize, and evaluate trustworthy software packages without relying on the polluted npm registry. The tool assesses modules based on several key metrics, such as **Ramp Up**, **Correctness**, **Bus Factor**, **Maintainer Responsiveness**, **License Compatibility**, **Version Pinning Practice**, and **Pull Request Review Practice**.

## Table of Contents

-   [Project Overview](#project-overview)
-   [Features](#features)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Metrics](#metrics)
-   [Environment Variables](#environment-variables)
-   [Testing](#testing)
-   [License](#license)

## Project Overview

The metrics evaluated by the rating tool focus on aspects such as code correctness, documentation quality, maintainability, security, version pinning practice, pull request review practice, and license compatibility.

## Features
-   **REST API** for package upload/update, evaluation, and organization
-   **Evaluates open-source Node.js modules** based on key software metrics.
-   **Supports both npm and GitHub URLs**.
-   **Parallel execution** of trustworthiness metric evaluations for better performance.

## Installation

### Prerequisites

-   **Node.js** and **npm** installed on your machine.

### Steps

1.  **Clone the repository**:    
    `git clone https://github.com/kumar488/461-Phase2.git
    cd 461-Phase2` 
    
2.  **Install dependencies**:
    `npm install` 
    
3.  **Create a `.env` file** in the root directory to configure environment variables:    
    `touch .env` 
    
4.  **Define environment variables** in your `.env` file:    
`LOG_LEVEL=1`Set log verbosity (0=silent, 1=info, 2=debug)
` LOG_FILE=./logs/app.log  ` Set the log file location
 `GITHUB_TOKEN=your_github_token`  # Your GitHub API token for fetching repository data

## Usage

### API Endpoints

1.  **POST /packages**:
    
 `Body Input: [
  {
    "Version": "Exact (1.2.3)\nBounded range (1.2.3-2.1.0)\nCarat (^1.2.3)\nTilde (~1.2.0)",
    "Name": "string"
  }
]` 
    
    Returns up to 10 packages from the registry based on the Version and Name inputs
    
2.  **DELETE /reset**:
    
    This resets the registry with default user credentials and empty packages table
    
3.  **GET /package/{id}**:
    
 `Param: {id} = ID number of the package in the registry` 
    
    Returns the data of the package in the registry, or a relevant status error code
    
4.  **POST /package/{id}**:
    
 `Param: {id} = ID number of the package in the registry`
`Body Input: {
  "metadata": {
    "Name": "string",
    "Version": "1.2.3",
    "ID": "123567192081501"
  },
  "data": {
    "Name": "string",
    "Content": "string",
    "URL": "string",
    "debloat": true,
    "JSProgram": "string"
  }
}`
    
    This updates an existing version of a package in the registry with a new version
    
5.  **POST /package**:
    
 `{
  "Content": "BASE64_ENCODED_CONTENT",
  "debloat": BOOL_VALUE,
  "Name": "PACKAGE_NAME"
}` 
or
 `{
  "URL": "GITHUB_REPO_URL",
  "debloat": BOOL_VALUE,
  "Name": "PACKAGE_NAME"
}` 
    
    This uploads a version of a new package into the registry
    
6.  **GET /package/{id}/rate**:
    
 `Param: {id} = ID number of the package in the registry` 
    
    This returns the net score evaluation along with its individual metric scores and latency measurements
    
7.  **GET /package/{id}/cost**:
    
 `Param: {id} = ID number of the package in the registry` 
    
    This returns the calculated cost of the package and its dependency tree
    
8.  **POST /package/byRegEx**:
    
 `{
  "RegEx": "INPUT_REGEX_HERE"
}` 
    
    This searches the registry for any package whose README file contains a regular expression match for the input RegEx
    

### Example Output

**GET /package/{id}/rate** endpoint:
Input: 
`{id} = 6`
Output:
`{
    "BusFactor": 0.2,
    "BusFactorLatency": 0.1,
    "Correctness": 0.97,
    "CorrectnessLatency": 0.1,
    "RampUp": 0.81,
    "RampUpLatency": 0.1,
    "ResponsiveMaintainer": 0.56,
    "ResponsiveMaintainerLatency": 0.1,
    "LicenseScore": 1,
    "LicenseScoreLatency": 0.1,
    "GoodPinningPractice": 0.2,
    "GoodPinningPracticeLatency": 0.1,
    "PullRequest": 1,
    "PullRequestLatency": 0.1,
    "NetScore": 0.62,
    "NetScoreLatency": 0.1
}` 

**POST /package/byRegEx** endpoint:
Input:
`{
  "RegEx": "fecha"
}`
Output:
`[
    {
        "Name": "fecha",
        "Version": "4.2.3",
        "ID": 1
    }
]` 

## Metrics

The CLI evaluates each module based on the following metrics:

1.  **RampUp**: How easy it is to get started with the module based on documentation quality and other factors.
2.  **Correctness**: Confidence that the module is functioning correctly based on issues and pull requests.
3.  **BusFactor**: The likelihood that the project will continue to be maintained (i.e., number of maintainers).
4.  **Responsiveness**: How responsive maintainers are to issues and pull requests.
5.  **License Compatibility**: Whether the module's license is compatible with ACME's use (LGPLv2.1).
6.  **Version Pinning Practice**: How well the module dependencies are version-pinned.
7.  **Pull Request Reviews**: How well the module codebase content was implemented with reviewed pull requests.

Each metric is scored between 0 (worst) and 1 (best).

### Performance and Latency

Each score is accompanied by a latency value, indicating the time (in seconds) it took to calculate that specific metric.

## Environment Variables

The tool relies on several environment variables for configuration:

-   **`LOG_LEVEL`**: Sets the verbosity of logging (0: silent, 1: info, 2: debug).
-   **`LOG_FILE`**: Specifies the log file path.
-   **`GITHUB_TOKEN`**: Required for accessing GitHub's API to fetch repository data.
-   **`DB_HOST`**: Specifies the package registry mySQL database host
-   **`DB_USER`**: Specifies the package registry mySQL database username
-   **`DB_PASSWORD`**: Specifies the package registry mySQL database password
-   **`DB_NAME`**: Specifies the package registry mySQL database name

Ensure to configure these variables in a `.env` file.

## Testing

The project includes a comprehensive test suite specifically for the API server functions with some line coverage.

To run the tests:
`npx jest --coverage`

The output will display the number of test cases passed and the achieved code coverage.

## License

This project is licensed under the **GNU Lesser General Public License v2.1 (LGPLv2.1)**. See the `LICENSE` file for more details.
