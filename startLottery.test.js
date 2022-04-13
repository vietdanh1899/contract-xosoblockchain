const lotteryContract = artifacts.require("Lottery");
const { lotto } = require("./settings.js")

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.lottery);

    const startLog = await lotteryInstance.getBasicLottoInfo(1);
    console.log(startLog);
    const currentLottoInfor = await lotteryInstance.getCurrentLottoInfo();
    console.log(currentLottoInfor)

    callback();
}