const ticketNftContract = artifacts.require("TicketNFT");
const lotteryContract = artifacts.require("Lottery");
const mock_erc20Contract = artifacts.require("ERC20Mock");
const randGenContract = artifacts.require("RandomNumberGenerator");
const mock_vrfCoordContract = artifacts.require("Mock_VRFCoordinator");

const { lotto } = require("../settings.js")

module.exports = async function (deployer) {
  var initialMoney = web3.utils.toWei('100');
  let addr = await web3.eth.getAccounts();
  let usdtInstance = await mock_erc20Contract.new("USD Tether", "USDT", addr[0], initialMoney);
  let linkInstance = await mock_erc20Contract.new(
    "Chain LINK", "LINK", addr[0], initialMoney
  );
  let mock_vrfCoordInstance = await mock_vrfCoordContract.new(
    linkInstance.address,
    lotto.chainLink.keyHash,
    lotto.chainLink.fee
  );
  let lotteryInstance = await lotteryContract.new(
    usdtInstance.address,
  );
  let randGenInstance = await randGenContract.new(
    mock_vrfCoordInstance.address,
    linkInstance.address,
    lotteryInstance.address,
    lotto.chainLink.keyHash,
    lotto.chainLink.fee
  );
  let ticketNftInstance = await ticketNftContract.new(
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
};