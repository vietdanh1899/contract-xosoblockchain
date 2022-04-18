const ticketNftContract = artifacts.require("TicketNFT");
const lotteryContract = artifacts.require("Lottery");
const mock_erc20Contract = artifacts.require("ERC20Mock");
const randGenContract = artifacts.require("RandomNumberGenerator");
const mock_vrfCoordContract = artifacts.require("Mock_VRFCoordinator");

const { lotto } = require("../../settings.js")

const deployContracts = async () => {
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
    await lotteryInstance.setOperatorAndTreasuryAddresses(addr[0], addr[0]);
    // Sending link to lottery
    await linkInstance.transfer(
        randGenInstance.address,
        web3.utils.toWei('10')
    );
    // Saving the info to be logged in the table (deployer address)
    var usdtLog = { Label: "Deployed Mock USDT Token Address", Info: usdtInstance.address };
    var lotteryLog = { Label: "Deployed Lottery Address", Info: lotteryInstance.address };
    var lotteryNftLog = { Label: "Deployed Ticket NFT Address", Info: ticketNftInstance.address };
    var linkLog = { Label: "Deployed Mock lINK Address", Info: linkInstance.address };

    console.table([
        lotteryLog,
        lotteryNftLog,
        usdtLog,
        linkLog
    ]);

    return {
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
    }
}



module.exports = deployContracts;