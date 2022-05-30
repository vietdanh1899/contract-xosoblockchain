const lotteryContract = artifacts.require("Lottery");
const UsdtMockContract = artifacts.require("UsdtMock");
const lotto = require("../settings.json")

module.exports = async function (callback) {
    var initialMoney = web3.utils.toWei('100');
    let addr = await web3.eth.getAccounts();
    let usdtInstance = await UsdtMockContract.new("USD Tether", "USDT", addr[0], initialMoney);
    console.log(usdtLog);

    let lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);
    let changeUsdtLog = await lotteryInstance.setUsdtAddress(usdtInstance.address);
    console.log(changeUsdtLog);

    console.log('Deployt USDT address : ', usdtInstance.address);

    callback();
}