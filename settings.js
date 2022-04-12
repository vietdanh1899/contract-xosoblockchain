const { ethers } = require("ethers");

const lotto = {
    lottery: '0x5Aa703b7007BA06357Ce11cfD8D85Ad5209b8f43',
    chainLink: {
        keyHash: "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
        fee: ethers.utils.parseUnits("0.0001", 18)
    },
    newLotto: {
        cost: ethers.utils.parseUnits("1", 18),
        closeIncrease: 10000,
        treasury: 2000
    },
    events: {
        new: "LotteryOpen",
        mint: "NewBatchMint",
        request: "requestNumbers"
    }
}

module.exports = {
    lotto
}