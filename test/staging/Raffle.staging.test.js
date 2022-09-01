const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { devChains, networkConfig } = require("../../helper-hardhat-config");

devChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", async () => {
        let raffle;
        let deployer, raffleEntranceFee, interval;
        const chainId = network.config.chainId;

        beforeEach(async () => {
            //the contract has been already deployed, we don't need a mock because we're on a testnet
            deployer = (await getNamedAccounts()).deployer;

            raffle = await ethers.getContract("Raffle", deployer);

            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });

        describe("fulfillRandomWords", () => {
            it("works with Chainlink Keepers and Chainlink VRF, we get a random winner", async () => {
                //In this test only the deployer enters the raffle
                const startingTimeStamp = await raffle.getLastTimeStamp();
                const accounts = await ethers.getSigners();

                //set up the listener
                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => {
                        try {
                            //asserts, after the pick of the winner
                            const recentWinner = await raffle.getRecentWinner();
                            const raffleState = await raffle.getRaffleState();
                            const winnerEndingBalance = await accounts[0].getBalance();
                            const currentTimeStamp = await raffle.getLastTimeStamp();

                            console.log("Asserting...");

                            //check if the raffle has been resetted
                            console.log("nice");
                            await (expect(raffle.getPlayer(0))).to.be.reverted;
                            console.log("nice");
                            assert.equal(raffleState.toString(), "0");
                            console.log("nice");
                            assert(currentTimeStamp > startingTimeStamp);
                            console.log("nice");
                            assert(recentWinner.toString(), accounts[0].address);
                            console.log("nice");
                            assert(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee).toString());
                            console.log("nice");
                            resolve();
                        }
                        catch (e) {
                            console.log(e);
                            reject();
                        }
                    });

                    //then entering the raffle
                    await raffle.enterRaffle({ value: raffleEntranceFee });
                    const winnerStartingBalance = await accounts[0].getBalance();
                });
            });
        });
    });