//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILottery {
    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    function numbersDrawn(
        uint256 _lotteryId,
        bytes32 _requestId,
        uint256 _randomNumber
    ) external;

    /**
     * @notice View current lottery id
     */
    function viewCurrentLotteryId() external view returns (uint256);
}
