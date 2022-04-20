const BigNumber = require("bignumber.js");
const lotteryContract = artifacts.require("Lottery");
const lotto = require("./settings.json")

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);
    
    const startLog = await lotteryInstance.getCurrentLottoInfo();
    console.log(startLog);

    callback();
}