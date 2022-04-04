const { ethers } = require("ethers");

const lotto = {
    chainLink: {
        keyHash: "0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4",
        fee: ethers.utils.parseUnits("0.0001", 18)
    },
}

module.exports = {
    lotto
}