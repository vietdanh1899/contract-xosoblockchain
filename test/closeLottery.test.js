const BigNumber = require("bignumber.js");
const lotto = require("../settings.json");
const deployContracts = require("./utils/deployContracts.js");

const truffleAssert = require('truffle-assertions');
const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    time
} = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const TOLERANCE_SECONDS = new BN(1);

describe("Test close lottery", () => {
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
        // Getting the current block timestamp
        let currentTime = await lotteryInstance.getCurrentTime();
        // Converting to a BigNumber for manipulation 
        let timeStamp = new BigNumber(currentTime.toString());
        const startLog = await lotteryInstance.startLottery(
            web3.utils.toWei(lotto.newLotto.cost),
            timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
            lotto.newLotto.treasury
        );
        expectEvent(startLog, lotto.events.new, (ev) => {
            return ev.lotteryId == 1 && ev.ticketSupply == 0;
        })
        await time.advanceBlock();
    });

    it("normal case", async function () {
        let start = await time.latest();

        await time.increase(time.duration.seconds(lotto.newLotto.closeIncrease));

        const end = start.add(time.duration.seconds(lotto.newLotto.closeIncrease));

        const now = await time.latest();
        //Check time manipulation working
        expect(now).to.be.bignumber.closeTo(end, TOLERANCE_SECONDS);

        // ---------------
        const lotteryInfoBefore = await lotteryInstance.getBasicLottoInfo(1);
        const closeLog = await lotteryInstance.closeLottery(1);

        let requestId = closeLog.logs[0].args.requestId.toString();

        // Mocking the VRF Coordinator contract for random request fulfilment 
        await mock_vrfCoordInstance.callBackWithRandomness(
            requestId,
            lotto.draw.random,
            randGenInstance.address,
            { from: addr[0] }
        );
        // Getting info after call
        const lotteryInfoAfter = await lotteryInstance.getBasicLottoInfo(1);
        // Testing
        assert.equal(
            lotteryInfoBefore.winningNumbers.toString(),
            lotto.newLotto.blankWinningNumbers,
            "Winning numbers set before call"
        );
        console.log(lotteryInfoAfter.winningNumbers.toString());
        assert.equal(
            lotteryInfoAfter.winningNumbers.toString(),
            lotto.draw.random,
            "Winning numbers incorrect after"
        );
    });
});
