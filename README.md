# fcc-hardhat-smartcontract-lottery
Lesson 9 of 32 hours course about Web3 fullstack by freecodecamp

# Index

- [Getting Started](#Getting Started)
  - [Requirements](#requirements)
  - [Quickstart](#quickstart)
    - [Clone from Github](#clone-from-github)
    - [Install dependencies](#install-dependencies)
- [Useage](#useage)
  - [Deploy](#deploy)
  - [Testing](#testing)
    - [Test Coverage](#test-coverage)
- [Deployment to a testnet or mainnet](#deployment-to-a-testnet-or-mainnet)
    - [Estimate gas cost in USD](#estimate-gas-cost-in-usd)
  - [Verify on etherscan](#verify-on-etherscan)
  
 # Getting started 
 
 ## Requirements
  - [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
    - You'll know if you have git installed by running the command `git --version` on your terminal and see a response like `git version x.x.x`
  - [Nodejs](https://nodejs.org/en/)
    - You'll know if you have Node.js installed by running the command `node --version` or `node -v` on your terminal and see a response like `vx.x.x`
  - [Npm](https://www.npmjs.com/)
    - It should be installed with Node.js
 
 ## Quickstart
 
 ### Clone from Github
 
 ```bash
  git clone https://github.com/Pasq04/fcc-hardhat-smartcontract-lottery
  cd fcc-hardhat-smartcontract-lottery
 ```
 
 ### Install dependencies
 
 ```bash
  npm i --save-dev
 ```
# Usage

## Deploy

```bash
  npx hardhat deploy
```
## Testing

``` bash
  npx hardhat test
```

### Test Coverage

```bash
  npx hardhat coverage
```
#Deploying to a testnet or a mainnet

1. Setup environment variables
  You'll set your `RINKEBY_RPC_URL` and your `PRIVATE_KEY` as environment variables. 
  You have to create a new `.env` file and put them into this file like below:
    ```Properties
      RINKEBY_RPC_URL = "value"
      PRIVATE_KEY = "value"
     ```
