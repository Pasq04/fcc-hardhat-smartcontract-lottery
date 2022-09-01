const { networkConfig, devChains } = require("../helper-hardhat-config");
const { network, ethers } = require("hardhat");

const { verify } = require("../utils/verify");

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("2");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    //moking of VRF v2
    let VRFCoordinatorV2Address, subscriptionId;
    if (devChains.includes(network.name)) {
        const VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address;

        //get the subscriptionID
        const transactionResponse = await VRFCoordinatorV2Mock.createSubscription();
        const transactionReceipt = await transactionResponse.wait(1);
        subscriptionId = transactionReceipt.events[0].args.subId;

        //fund the subscription
        await VRFCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
    }
    else {
        VRFCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }
    console.log(VRFCoordinatorV2Address);

    const entranceFee = networkConfig[chainId]["entranceFee"];
    const gasLane = networkConfig[chainId]["gasLane"];
    const callbackGasLimit = networkConfig[chainId]["gasLimit"];
    const interval = networkConfig[chainId]["interval"];

    const args = [VRFCoordinatorV2Address, entranceFee, gasLane, subscriptionId, callbackGasLimit, interval];

    console.log(args);

    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!devChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verify contract...");
        const contractAddress = raffle.address;
        await verify(contractAddress, args);
    }
    log("------------------------------");
};

module.exports.tags = ["all", "raffle"];
