# fcc-hardhat-smartcontract-lottery
Lesson 9 of 32 hours course about Web3 fullstack by freecodecamp

# Index

- [Getting Started](#getting-started)
  - [Requirements](#requirements)
  - [Quickstart](#quickstart)
    - [Clone from Github](#clone-from-github)
    - [Install dependencies](#install-dependencies)
- [Useage](#useage)
  - [Deploy](#deploy)
  - [Testing](#testing)
    - [Test Coverage](#test-coverage)
- [Deployment to a testnet or mainnet](#deployment-to-a-testnet-or-mainnet)
    - [Estimate gas cost in EUR](#estimate-gas-cost-in-eur)
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
# Deploying to a testnet or a mainnet

1. Setup environment variables
  
  You'll set your `RINKEBY_RPC_URL` and your `PRIVATE_KEY` as environment variables. 
  You have to create a new `.env` file and put them into this file like below:
    ```Properties
      RINKEBY_RPC_URL = "value"
      PRIVATE_KEY = "value"
     ```
  
  - ### What is the `RINKEBY_RPC_URL` and how you can get it
  
      The `RINKEBY_RPC_URL` is the URL of the Rinkeby testnet node you're going to work with during your tests, you can get it for free from [Alchemy](https://alchemy.com/?a=673c802981)
  
  - ### What is the `PRIVATE_KEY` and how you can get it
   
      The `PRIVATE_KEY` is the private key of your account (like from [metamask](https://metamask.io/)). 
   **NOTE:** FOR DEVELOPMENT, PLEASE USE A KEY THAT DOESN'T HAVE ANY REAL FUNDS ASSOCIATED WITH IT.

2. Get Testnet ETH
  
    Head over to [faucets.chain.link](https://faucets.chain.link/) and get some tesnet ETH & LINK.
    You should see the ETH and LINK show up in your metamask.


3. Setup a Chainlink VRF Subscription ID
  
    Head over to [vrf.chain.link](https://vrf.chain.link/) and setup a new subscription, and get a subscriptionId. 
    You can reuse an old subscription if you already have one. 
  
    In your `helper-hardhat-config.js` add your `subscriptionId` under the section of the chainId you're using. 
    If you're deploying to rinkeby, add your `subscriptionId` in the `subscriptionId` field under the `4` section.
  
    Then run:
    ```bash
      npx hardhat deploy --network rinkeby
    ```

    And copy / remember the contract address. 
  
 4. Add your contract address as a Chainlink VRF Consumer

    Go back to [vrf.chain.link](https://vrf.chain.link) and under your subscription add `Add consumer` and add your contract address. 
    You should also fund the contract with a minimum of 1 LINK. 

5. Register a Chainlink Keepers Upkeep
   
   [You can follow the documentation if you get lost.](https://docs.chain.link/docs/chainlink-keepers/compatible-contracts/)

    Go to [keepers.chain.link](https://keepers.chain.link/new) and register a new upkeep.

6. Enter your Raffle!
    Enter the lottery by running:

    ```bash
      npx hardhat run scripts/enter.js --network rinkeby
    ```


## Estimate gas cost in EUR

## Verify on Etherscan
