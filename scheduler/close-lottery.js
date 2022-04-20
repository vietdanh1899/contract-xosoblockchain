const lotteryContract = artifacts.require("Lottery");
const lotto = require("../settings.json")

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);

    const currentLotto = await lotteryInstance.getCurrentLottoInfo();
    const closeLog = await lotteryInstance.closeLottery(currentLotto.lotteryID);
    console.log(closeLog.logs[0]);
    let requestId = closeLog.logs[0].args.requestId.toString();

    // Mocking the VRF Coordinator contract for random request fulfilment 
    await mock_vrfCoordInstance.callBackWithRandomness(
        requestId,
        lotto.draw.random,
        randGenInstance.address,
        { from: addr[0] }
    );

    callback();
}