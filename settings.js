const { ethers } = require("ethers");

const lotto = {
    lottery: '0x8cb1e80f28ca82aC15536742707A99bB673A70B6',
    chainLink: {
        keyHash: "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
        fee: ethers.utils.parseUnits("0.0001", 18)
    },
    newLotto: {
        cost: ethers.utils.parseUnits("1", 18), // 1 USDT
        closeIncrease: 86400,
        treasury: 2000, // 20%
        blankWinningNumbers: 111
    },
    events: {
        new: "LotteryOpen",
        mint: "NewBatchMint",
        request: "requestNumbers",
        prize: "PrizePoolChanged"
    },
    draw: {
        random: 18
    },
}

module.exports = {
    lotto
}