const BigNumber = require("bignumber.js");
const lotteryContract = artifacts.require("Lottery");
const lotto = require("../settings.json")

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);
    
    // Getting the current block timestamp
    let currentTime = await lotteryInstance.getCurrentTime();
    // Converting to a BigNumber for manipulation 
    let timeStamp = new BigNumber(currentTime.toString());
    const startLog = await lotteryInstance.startLottery(
        web3.utils.toWei(lotto.newLotto.cost),
        timeStamp.plus(lotto.newLotto.closeIncrease).toString(),
        lotto.newLotto.treasury
    );
    console.log(startLog.logs[0]);

    callback();
}