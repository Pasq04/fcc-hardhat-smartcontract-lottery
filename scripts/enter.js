const { ethers } = require("hardhat");

async function enter() {
    const raffle = await ethers.getContract("Raffle");
    const entranceFee = await raffle.getEntranceFee();
    const transactionResponse = await raffle.enterRaffle({ value: entranceFee + 1 });
    const transactionReceipt = await transactionResponse.wait(1);
    console.log(transactionReceipt.hash);
    console.log("Entered!");
}

enter
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(1);
        process.exit(1);
    });