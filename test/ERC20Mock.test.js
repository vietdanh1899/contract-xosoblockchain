const ticketNftContract = artifacts.require("TicketNFT");
const lotteryContract = artifacts.require("Lottery");
const mock_erc20Contract = artifacts.require("ERC20Mock");
const randGenContract = artifacts.require("RandomNumberGenerator");
const mock_vrfCoordContract = artifacts.require("Mock_VRFCoordinator");

const { lotto } = require("../settings.js")
const chai = require("chai");

const expect = chai.expect;

describe("Test ERC20Mock contract", () => {
    let addr;
    // Creating the instance and contract info for the usdt token contract
    let usdtInstance;
    beforeEach(async function () {
        var initialMoney = web3.utils.toWei('100');
        addr = await web3.eth.getAccounts();
        usdtInstance = await mock_erc20Contract.new("USD Tether", "USDT", addr[0], initialMoney);
        // Saving the info to be logged in the table (deployer address)
        var usdtLog = { Label: "Deployed Mock USDT Token Address", Info: usdtInstance.address };

        console.table([
            usdtLog,
        ]);
    });

    it("normal case", async function () {
        await usdtInstance.mint(addr[1], web3.utils.toWei('10'));
        const balance = await usdtInstance.balanceOf(addr[1]);
        expect(balance.toString()).to.equal(web3.utils.toWei('10'));
    });
});
