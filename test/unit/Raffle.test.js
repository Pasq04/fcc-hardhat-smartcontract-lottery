const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { devChains, networkConfig } = require("../../helper-hardhat-config");

!devChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async () => {
        let raffle, vrfCoordinatorV2Mock;
        let deployer, raffleEntranceFee, interval;
        const chainId = network.config.chainId;

        beforeEach(async () => {
            await deployments.fixture(["all"]);
            deployer = (await getNamedAccounts()).deployer;

            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);

            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
        });

        describe("constructor", async () => {
            it("initializes the raffle correctly", async () => {
                let raffleState = await raffle.getRaffleState();

                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
            });
        });

        describe("enterRaffle", async () => {
            it("reverts if player doesn't pay enough", async () => {
                await expect(raffle.enterRaffle({ value: ethers.utils.parseEther("0") })).to.be.revertedWith("Raffle__NotEnoughEthEhtered");
            });

            it("records players when they enter", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                let playerFromContract = await raffle.getPlayer(0);
                assert(playerFromContract, deployer)
            });

            it("emits an event when a player enter", async () => {
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).emit(raffle, "RaffleEnter");
            });

            it("doesn't allow entrance when raffle is calculating", async () => {
                //first entrance
                await raffle.enterRaffle({ value: raffleEntranceFee });

                //increase the time of the blockchain (a sort of time travel)
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []); //it mines another block updated

                //call performUpKeep(), pretending to be a Chainlink Keeper
                await raffle.performUpkeep([]);

                //now the state should be CALCULATING
                await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith("Raffle__NotOpen()");
            });
        });

        describe("checkUpkeep", async () => {
            it("returns false if people haven't sent any EHT", async () => {
                //update the blockchain
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);

                //call function
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]); //with callstatic I simulate the call of the function without do any transaction
                assert(!upkeepNeeded);
            });

            it("returns false if raffle isn't open", async () => {
                //first entrance
                await raffle.enterRaffle({ value: raffleEntranceFee });

                //increase the time of the blockchain
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);

                //call performUpKeep(), pretending to be a Chainlink Keeper
                await raffle.performUpkeep([]);

                //now the state should be CALCULATING and upkeepNeeded should be false
                const raffleState = await raffle.getRaffleState();
                const { checkUpkeep } = await raffle.callStatic.checkUpkeep([]);

                assert.equal(raffleState.toString(), "1");
                assert(!checkUpkeep);
            });

            it("returns false if enough time hasn't passed", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });

                await network.provider.send("evm_increaseTime", [interval.toNumber() - 1]);
                await network.provider.send("evm_mine", []);

                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                assert.equal(upkeepNeeded, false);
            });

            it("returns true if enough time has passed, has players and eth and if it's open", async () => {
                //first entrance, give player and eth
                await raffle.enterRaffle({ value: raffleEntranceFee });

                //time travel
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);

                //the raffle is open as default
                const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                assert.equal(upkeepNeeded, true);
            });
        });

        describe("performUpkeep", async () => {
            it("it can only run if checkUpkeep is true", async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });

                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);

                //if there are some problems (checkUpkeep is false), performUpkeep doesn't work and transactionResponse is an error
                const transactionResponse = await raffle.performUpkeep([]);
                assert(transactionResponse);
            });

            it("reverts if checkUpkeep is false", async () => {
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded");
            });

            //same test as above but with specific value
            it("reverts if checkUpkeep is false, the raffle is empty and open", async () => {
                await expect(raffle.performUpkeep([])).to.be.revertedWith("Raffle__UpkeepNotNeeded(0, 0, 0)");
            });

            it("updates the raffle state, emits an event and calls the vrf coordinator", async () => {
                //condition for checkUpkeep
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);

                const transactionResponse = await raffle.performUpkeep([]);
                const transactionReceipt = await transactionResponse.wait(1);

                /*  
                    if the event has been emitted we could take the requestId as a parameter of the event, 
                    we call this event as 1 because the event 0 has been emitted before by the vrf coordinator, 
                    in fact our event after the call of the vrf coordinator is redudant
                */
                const requestId = transactionReceipt.events[1].args.requestId;
                assert(requestId.toNumber() > 0);

                const raffleState = await raffle.getRaffleState([]);
                assert.equal(raffleState.toString(), "1");
            });
        });

        describe("fulfillRandomWords", () => {
            beforeEach(async () => {
                await raffle.enterRaffle({ value: raffleEntranceFee });
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
            });

            it("can only be called after performUpkeep", async () => {
                //if performUpkeep hasn't been called the function in the vrf coordinator couldn't be called
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request");
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request");
            });

            it("picks a random winner, resets the lottery and sends money", async () => {
                //we need more accounts that enter the lottery except the account 0 that is the deployer
                const accounts = await ethers.getSigners();
                for (let i = 1; i <= 3; i++) {
                    const accountConnectedRaffle = raffle.connect(accounts[i]);
                    await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee });
                }

                const startingTimeStamp = await raffle.getLastTimeStamp();

                //we will have to wait for the fulfillRandomWords to be called
                //so we create a listener for the event that fulfillRandomWords emit
                await new Promise(async (resolve, reject) => {
                    raffle.once("WinnerPicked", async () => {
                        try {
                            //fulfillRandomWords was called so we can do the assertion
                            const recentWinner = await raffle.getRecentWinner();
                            const raffleState = await raffle.getRaffleState();
                            const numPlayers = await raffle.getNumOfPlayers();
                            const currentTimeStamp = await raffle.getLastTimeStamp();

                            const winnerEndingBalance = await accounts[1].getBalance();

                            console.log(`The winner is: ${recentWinner}`);
                            console.log(0, accounts[0].address);
                            console.log(1, accounts[1].address);
                            console.log(2, accounts[2].address);
                            console.log(3, accounts[3].address);


                            assert.equal(numPlayers.toString(), "0");
                            assert.equal(raffleState.toString(), "0");
                            assert(currentTimeStamp > startingTimeStamp);
                            assert(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee.mul(4)).toString());
                        }
                        catch (e) {
                            reject();
                        }
                        resolve();
                    });

                    //the listener is active, the promise won't be resolved until the listener doesn't receive the event
                    const transactionResponse = await raffle.performUpkeep([]);
                    const transactionReceipt = await transactionResponse.wait(1);

                    //for this test the winner is the account 1
                    const winnerStartingBalance = await accounts[1].getBalance();

                    await vrfCoordinatorV2Mock.fulfillRandomWords(transactionReceipt.events[1].args.requestId, raffle.address);
                });
            });
        });
    });