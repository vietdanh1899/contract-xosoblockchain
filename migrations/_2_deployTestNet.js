const ticketNftContract = artifacts.require("TicketNFT");
const lotteryContract = artifacts.require("Lottery");
const randGenContract = artifacts.require("RandomNumberGenerator");
const UsdtMockContract = artifacts.require("UsdtMock");

const settings = require("../settings.json")

module.exports = async function (deployer) {
  let addr = await web3.eth.getAccounts();
  var initialMoney = web3.utils.toWei('100', 'picoether');

  let usdtInstance = await UsdtMockContract.new("USD Tether", "USDT", addr[0], initialMoney);
  let lotteryInstance = await lotteryContract.new(
    usdtInstance.address,
    // settings.contractAddress.usdt
  );
  let randGenInstance = await randGenContract.new(
    settings.contractAddress.vrfCoord,
    settings.contractAddress.link,
    lotteryInstance.address,
    settings.chainLink.keyHash,
    web3.utils.toWei(settings.chainLink.fee)
  );
  let ticketNftInstance = await ticketNftContract.new(
    "https://xosoblockchain.tech/api/tokens/\{id\}",
    lotteryInstance.address
  );
  // Final set up of contracts
  await lotteryInstance.initialize(
    ticketNftInstance.address,
    randGenInstance.address
  );
  await lotteryInstance.setOperatorAndTreasuryAddresses(addr[0], addr[0]);

  // Saving the info to be logged in the table (deployer address)
  var usdtLog = { Label: "Deployed Mock USDT Token Address", Info: usdtInstance.address };
  // var usdtLog = { Label: "Deployed Mock USDT Token Address", Info: settings.contractAddress.usdt };
  var lotteryLog = { Label: "Deployed Lottery Address", Info: lotteryInstance.address };
  var lotteryNftLog = { Label: "Deployed Ticket NFT Address", Info: ticketNftInstance.address };
  var linkLog = { Label: "Deployed Mock lINK Address", Info: settings.contractAddress.link };
  var randGenContractLog = { Label: "Deployed Random Generator Address", Info: randGenInstance.address };

  console.table([
    lotteryLog,
    lotteryNftLog,
    usdtLog,
    linkLog,
    randGenContractLog
  ]);

  settings.contractAddress.lottery = lotteryInstance.address;
  settings.contractAddress.ticketNft = ticketNftInstance.address;
  settings.contractAddress.randGen = randGenInstance.address;
  settings.contractAddress.usdt = usdtInstance.address;

  console.log(JSON.stringify(settings));
};