const BigNumber = require("bignumber.js");
const { lotto } = require("../settings.js")
const chai = require("chai");
const deployContracts = require("./utils/deployContracts.js");

const expect = chai.expect;
const truffleAssert = require('truffle-assertions');

describe("Test lottery contract", () => {

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

    describe("Buy tickets", function () {
        beforeEach(async () => {
            // Getting the current block timestamp
            let currentTime = await lotteryInstance.getCurrentTime();
            // Converting to a BigNumber for manipulation 
            let timeStamp = new BigNumber(currentTime.toString());
            const startLog = await lotteryInstance.startLottery(
                lotto.newLotto.cost,
                timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
                lotto.newLotto.treasury
            );
        });

        it("Buy tickets normal case", async function () {
            await usdtInstance.mint(addr[1], web3.utils.toWei('10'));
            const balance = await usdtInstance.balanceOf(addr[1]);
            expect(balance.toString()).to.equal(web3.utils.toWei('10'));
            // Getting the price to buy
            let price = await lotteryInstance.costToBuyTickets(
                1,
                1
            );
            // Generating chosen numbers for buy
            let ticketNumbers = 9
            // Approving lotto to spend cost
            await usdtInstance.approve(
                lotteryInstance.address,
                price,
                { from: addr[1] }
            );
            // Batch buying tokens
            const buyLog = await lotteryInstance.buyTickets(
                1,
                1,
                ticketNumbers,
                { from: addr[1] }
            );
            truffleAssert.eventEmitted(buyLog, lotto.events.prize, (ev) => {
                return ev.currentPrizePool == web3.utils.toWei('1')
                    && ev.currentLotteryId == 1;
            });
            // Testing results
            assert.equal(
                price.toString(),
                lotto.newLotto.cost,
                "Incorrect cost for batch buy of 1"
            );

        });
    });

});
