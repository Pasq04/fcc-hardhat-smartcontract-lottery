//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol"; //contract for getting random number
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol"; //interface of the coordinator for the verification of the random number
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol"; //interface of the contract compatible with the chainlink keepers

error Raffle__NotEnoughEthEhtered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__UpkeepNotNeeded(uint256 currentBalance, uint256 numPlayers, uint256 raffleState);

/**
 * @title A sample Raffle Contract
 * @author Pasquale Morabito
 * @dev This implements Chainlink VRF v2 and Chainlink keepers
 */

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* Types */
    enum RaffleState {
        OPEN,
        CALCULATING
    }

    /* State Variables */
    uint256 private immutable i_entranceFee;
    address payable[] private s_players;
    VRFCoordinatorV2Interface private immutable vrfCoordinator;
    bytes32 private immutable i_keyHash; //maximum price you are willing to pay for the request(in wei)
    uint64 private immutable i_subscriptionId; //subscription ID that the contract uses for funding the requests
    uint16 private constant REQUEST_CONFIRMATIONS = 3; //the number of confirmations that the Chainlink node should wait before responding
    uint32 private immutable i_callbackGasLimit; //maximum number of gas that could be used by the callback function(fulfillRandomWords()), if the contract spends more gas for this function it'll be blocked
    uint32 private constant NUM_WORDS = 1; //number of random numbers we want to get

    address payable private s_recentWinner;
    RaffleState private s_raffleState;
    uint256 private s_lastTimeStamp; //last timestamp in which the contract has been upkeept
    uint256 private immutable i_interval; //interval between two timestamp in seconds

    /* Events */
    event RaffleEnter(address indexed player); //indexed parameters(topics) are parameters of an event that are easier to search but more expensive in terms of gas
    event RequestedRaffleWinner(uint256 indexed requestId);
    event WinnerPicked(address indexed winner);

    /* Functions */
    constructor(
        address vrfCoordinatorV2,
        uint256 _entranceFee,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint32 _callbackGasLimits,
        uint256 _interval
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        //vrfCoordinatorV2 is the address of the contract that does the random number verification
        vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_entranceFee = _entranceFee;
        i_keyHash = _keyHash;
        i_subscriptionId = _subscriptionId;
        i_callbackGasLimit = _callbackGasLimits;
        s_raffleState = RaffleState.OPEN;
        s_lastTimeStamp = block.timestamp;
        i_interval = _interval;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthEhtered();
        }
        if (s_raffleState != RaffleState.OPEN) {
            revert Raffle__NotOpen();
        }
        s_players.push(payable(msg.sender));
        emit RaffleEnter(msg.sender);
    }

    /**
     * @dev This is the function that the Chainlink keeper nodes call
     * they look for the `upkeepNeeded` to return true.
     * If it's true we request a new random number(a new winner).
     * In order to be true the following conditions should be true:
     * 1. Our time interval should be passed.
     * 2. The lottery should have at least 1 player and some EHT.
     * 3. Our subscription has to be funded in LINK.
     * 4. The lottery should be in an "open" state.
     */
    function checkUpkeep(
        bytes memory /* checkData */
    )
        public
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = s_raffleState == RaffleState.OPEN;
        bool timePassed = (block.timestamp - s_lastTimeStamp) > i_interval;
        bool hasPlayers = s_players.length > 0;
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = isOpen && timePassed && hasPlayers && hasBalance;
    }

    /**
     * @dev function that get executed by the keepers since checkUpkeep() returns true
     */
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) revert Raffle__UpkeepNotNeeded(address(this).balance, s_players.length, uint256(s_raffleState));

        s_raffleState = RaffleState.CALCULATING; //in this way nobody could enter in the lottery and trigger a new update
        uint256 requestId = vrfCoordinator.requestRandomWords(i_keyHash, i_subscriptionId, REQUEST_CONFIRMATIONS, i_callbackGasLimit, NUM_WORDS);
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        //override means that it's the overwriting of an existing function that is "virtual" in VRFConsumerBaseV2.sol

        //get the winnner
        uint256 indexOfWinner = randomWords[0] % s_players.length;
        s_recentWinner = s_players[indexOfWinner];

        //repoen the lottery
        s_raffleState = RaffleState.OPEN;

        //reset the players array
        s_players = new address payable[](0);

        //reset the timestamp
        s_lastTimeStamp = block.timestamp;

        //give money to the winner
        (bool success, ) = s_recentWinner.call{value: address(this).balance}("");
        if (!success) revert Raffle__TransferFailed();
        emit WinnerPicked(s_recentWinner);
    }

    /* view / pure functions */
    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 _idx) public view returns (address) {
        return s_players[_idx];
    }

    function getRecentWinner() public view returns (address) {
        return s_recentWinner;
    }

    function getRaffleState() public view returns (RaffleState) {
        return s_raffleState;
    }

    function getNumWords() public pure returns (uint256) {
        return NUM_WORDS;
    }

    function getNumOfPlayers() public view returns (uint256) {
        return s_players.length;
    }

    function getLastTimeStamp() public view returns (uint256) {
        return s_lastTimeStamp;
    }

    function getRequestConfirmations() public pure returns (uint256) {
        return REQUEST_CONFIRMATIONS;
    }

    function getInterval() public view returns (uint256) {
        return i_interval;
    }
}
