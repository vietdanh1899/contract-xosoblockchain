const ticketNftContract = artifacts.require("TicketNFT");
const lotteryContract = artifacts.require("Lottery");
const mock_erc20Contract = artifacts.require("ERC20Mock");
const randGenContract = artifacts.require("RandomNumberGenerator");
const mock_vrfCoordContract = artifacts.require("Mock_VRFCoordinator");

const { lotto } = require("../settings.js")
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

chai.use(solidity);
const expect = chai.expect;

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
        var initialMoney = web3.utils.toWei('100');
        addr = await web3.eth.getAccounts();
        usdtInstance = await mock_erc20Contract.new("USD Tether", "USDT", addr[0], initialMoney);
        linkInstance = await mock_erc20Contract.new(
            "Chain LINK", "LINK", addr[0], initialMoney
        );
        mock_vrfCoordInstance = await mock_vrfCoordContract.new(
            linkInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        lotteryInstance = await lotteryContract.new(
            usdtInstance.address,
        );
        randGenInstance = await randGenContract.new(
            mock_vrfCoordInstance.address,
            linkInstance.address,
            lotteryInstance.address,
            lotto.chainLink.keyHash,
            lotto.chainLink.fee
        );
        ticketNftInstance = await ticketNftContract.new(
            "https://testing.com/tokens/\{id\}",
            lotteryInstance.address
        );
        // Final set up of contracts
        await lotteryInstance.initialize(
            ticketNftInstance.address,
            randGenInstance.address
        );
        // Sending link to lottery
        await linkInstance.transfer(
            randGenInstance.address,
            web3.utils.toWei('10')
        );
        // Saving the info to be logged in the table (deployer address)
        var usdtLog = { Label: "Deployed Mock USDT Token Address", Info: usdtInstance.address };
        var lotteryLog = { Label: "Deployed Lottery Address", Info: lotteryInstance.address };
        var lotteryNftLog = { Label: "Deployed Lottery NFT Address", Info: ticketNftInstance.address };
        var linkLog = { Label: "Deployed Mock lINK Address", Info: linkInstance.address };

        console.table([
            lotteryLog,
            lotteryNftLog,
            usdtLog,
            linkLog
        ]);
    });

    it("normal case", async function () {
        // Getting the current block timestamp
        let currentTime = await lotteryInstance.getCurrentTime();
        // Converting to a BigNumber for manipulation 
        // let timeStamp = new BigNumber(currentTime.toString());
        // Creating a new lottery
        // await expect(
        const log = await lotteryInstance.startLottery(
            lotto.newLotto.cost,
            // timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
            currentTime + lotto.newLotto.closeIncrease,
            100,
            { from: addr[0] }
        )
        console.log(log);
        // ).to.emit(lotteryInstance, lotto.events.new)
        //     // Checking that emitted event contains correct information
        //     .withArgs(
        //         1,
        //         0
        //     );
    });
});
