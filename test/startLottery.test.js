const BigNumber = require("bignumber.js");
const lotto = require("../settings.json");
const deployContracts = require("./utils/deployContracts.js");

const assert = require("chai").assert;
const truffleAssert = require('truffle-assertions');

describe("Test start lottery", () => {
    let addr;
    // Creating the instance and contract info for the lottery contract
    let lotteryInstance;
    // Creating the instance and contract info for the ticket NFT contract
    let ticketNftInstance;
    // Creating the instance and contract info for the usdt token contract
    let usdtInstance;
    // Creating the instance and contract info for the mock rand gen
    let randGenInstance;
    // Creating the instance and contract of all the contracts needed to mock
    // the ChainLink contract ecosystem. 
    let linkInstance;
    let mock_vrfCoordInstance;
    beforeEach(async function () {
        ({
            addr,
            // Creating the instance and contract info for the lottery contract
            lotteryInstance,
            // Creating the instance and contract info for the ticket NFT contract
            ticketNftInstance,
            // Creating the instance and contract info for the usdt token contract
            usdtInstance,
            // Creating the instance and contract info for the mock rand gen
            randGenInstance,
            // Creating the instance and contract of all the contracts needed to mock
            // the ChainLink contract ecosystem. 
            linkInstance,
            mock_vrfCoordInstance
        } = await deployContracts());
    });

    it("normal case", async function () {
        // Getting the current block timestamp
        let currentTime = await lotteryInstance.getCurrentTime();
        // Converting to a BigNumber for manipulation 
        let timeStamp = new BigNumber(currentTime.toString());
        const startLog = await lotteryInstance.startLottery(
            web3.utils.toWei(lotto.newLotto.cost),
            timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
            lotto.newLotto.treasury
        );
        truffleAssert.eventEmitted(startLog, lotto.events.new, (ev) => {
            return ev.lotteryId == 1 && ev.ticketSupply == 0;
        })
    });

});
