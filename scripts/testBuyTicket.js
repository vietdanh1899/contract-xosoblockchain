const BigNumber = require("bignumber.js");
const lotteryContract = artifacts.require("Lottery");
const usdt = artifacts.require("ERC20");
const lotto = require("../settings.json")

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);
    usdtInstance = await lotteryContract.at(lotto.contractAddress.usdt);
    
    const startLog = await lotteryInstance.getCurrentLottoInfo();
    console.log(startLog);

    const usdtLog = await usdtInstance.approve(lotto.contractAddress.lottery, web3.utils.toWei('0.1'));
    console.log(usdtLog);

    callback();
}