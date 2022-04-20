const lotteryContract = artifacts.require("Lottery");
const mock_vrfCoordContract = artifacts.require("Mock_VRFCoordinator");
const lotto = require("../settings.json");
const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    time
} = require('@openzeppelin/test-helpers');

module.exports = async function (callback) {
    lotteryInstance = await lotteryContract.at(lotto.contractAddress.lottery);
    mock_vrfCoordInstance = await mock_vrfCoordContract.at(lotto.contractAddress.vrfCoord);
    addr = await web3.eth.getAccounts();

    const currentLotto = await lotteryInstance.getCurrentLottoInfo();

    let current = (await time.latest()).toString();
    console.log('current time', current);
    console.log('close time', currentLotto.closingTimestamp)
    if (currentLotto.closingTimestamp > current) {
        await time.increaseTo(currentLotto.closingTimestamp);
    }
    
    const closeLog = await lotteryInstance.closeLottery(currentLotto.lotteryID);
    console.log(closeLog.logs[0]);
    let requestId = closeLog.logs[0].args.requestId.toString();

    // Mocking the VRF Coordinator contract for random request fulfilment 
    await mock_vrfCoordInstance.callBackWithRandomness(
        requestId,
        lotto.draw.random,
        lotto.contractAddress.randGen,
        { from: addr[0] }
    );

    callback();
}