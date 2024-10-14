# ACME Corporation: CLI for Trustworthy Module Re-Use

This project is a **Command-Line Interface (CLI)** tool designed to help ACME Corporation's engineers evaluate and select open-source Node.js modules. The tool assesses modules based on several key metrics, such as **RampUp**, **Correctness**, **BusFactor**, **Responsiveness**, and **License Compatibility**.

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

ACME Corporation is expanding its Node.js-based services and is re-using open-source packages from npm. This CLI tool evaluates npm packages and GitHub-hosted repositories to help engineers select trustworthy modules. The metrics provided by this tool focus on aspects such as documentation quality, maintainability, security, and license compatibility.

## Features

-   **Evaluates open-source Node.js modules** based on key software metrics.
-   **Supports both npm and GitHub URLs**.
-   **Parallel execution** of metric evaluations for better performance.

## Installation

### Prerequisites

-   **Node.js** and **npm** installed on your machine.

### Steps

1.  **Clone the repository**:    
    `git clone https://github.com/acme-corp/trustworthy-module-cli.git
    cd trustworthy-module-cli` 
    
2.  **Install dependencies**:
    `npm install` 
    
3.  **Create a `.env` file** in the root directory to configure environment variables:    
    `touch .env` 
    
4.  **Define environment variables** in your `.env` file:    
    `LOG_LEVEL=1              # Set log verbosity (0=silent, 1=info, 2=debug)
    LOG_FILE=./logs/app.log   # Set the log file location
    GITHUB_TOKEN=your_github_token  # Your GitHub API token for fetching repository data`   

## Usage

### CLI Commands

1.  **Install Dependencies**:
    
 `./run install` 
    
    This installs any required dependencies.
    
2.  **Evaluate Repositories**: To evaluate a set of repositories provided in a file:    
    `./run /path/to/URL_FILE` 
    
    The file should contain a newline-separated list of URLs from npm or GitHub. Example:   
    `https://www.npmjs.com/package/express
    https://github.com/jonschlinkert/micromatch` 
    
3.  **Run Tests**: To execute the test suite and check code coverage:
   `./run test` 
    

### Example Output

The tool outputs the **NetScore** and its components for each module in the following format:
`{
  "URL": "https://github.com/jonschlinkert/micromatch",
  "NetScore": 0.85,
  "RampUp": 0.90,
  "Correctness": 0.80,
  "BusFactor": 0.70,
  "Responsiveness": 0.75,
  "License": 1.00,
  "NetScore_Latency": 0.250,  # Time to calculate the score in seconds
  ...
}` 

## Metrics

The CLI evaluates each module based on the following metrics:

1.  **RampUp**: How easy it is to get started with the module based on documentation quality and other factors.
2.  **Correctness**: Confidence that the module is functioning correctly based on issues and pull requests.
3.  **BusFactor**: The likelihood that the project will continue to be maintained (i.e., number of maintainers).
4.  **Responsiveness**: How responsive maintainers are to issues and pull requests.
5.  **License Compatibility**: Whether the module's license is compatible with ACME's use (LGPLv2.1).

Each metric is scored between 0 (worst) and 1 (best).

### Performance and Latency

Each score is accompanied by a latency value, indicating the time (in seconds) it took to calculate that specific metric.

## Environment Variables

The tool relies on several environment variables for configuration:

-   **`LOG_LEVEL`**: Sets the verbosity of logging (0: silent, 1: info, 2: debug).
-   **`LOG_FILE`**: Specifies the log file path.
-   **`GITHUB_TOKEN`**: Required for accessing GitHub's API to fetch repository data.

Ensure to configure these variables in a `.env` file.

## Testing

The project includes a comprehensive test suite with at least 20 test cases and over 80% code coverage.

To run the tests:
`./run test` 

The output will display the number of test cases passed and the achieved code coverage.

## License

This project is licensed under the **GNU Lesser General Public License v2.1 (LGPLv2.1)**. See the `LICENSE` file for more details.
