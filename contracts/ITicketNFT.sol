//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ITicketNFT {
    // Storage for ticket information
    struct TicketInfo {
        address owner;
        uint8 numbers;
        uint256 lotteryId;
        uint8 numberOfTickets;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getCurrentTicketId() external view returns (uint256);

    function getTicketNumbers(uint256 _ticketID) external view returns (uint8);

    function getOwnerOfTicket(uint256 _ticketID)
        external
        view
        returns (address);

    function getUserTickets(uint256 _lotteryId, address _user)
        external
        view
        returns (uint256[] memory);

    function getTicketInfo(uint256 _ticketID)
        external
        view
        returns (TicketInfo memory);

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    function Mint(
        address _to,
        uint256 _lottoID,
        uint8 _numberOfTickets,
        uint8 _numbers
    ) external returns (uint256);

    function getWinningTickets(
        uint256 _lotteryId,
        uint256 _randomNumber,
        uint256 _firstTicketId
    ) external returns (uint256, TicketInfo[] memory);
}
