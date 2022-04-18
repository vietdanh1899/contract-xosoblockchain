//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
// Safe math
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SafeMath8.sol";
import "./ITicketNFT.sol";

contract TicketNFT is ITicketNFT, ERC1155 {
    // Libraries
    // Safe math
    using SafeMath for uint256;
    using SafeMath8 for uint8;

    // State variables
    address internal lotteryContract_;

    uint256 internal currentTicketId;
    TicketInfo[] private winningTickets;
    // Token ID => Token information
    mapping(uint256 => TicketInfo) internal ticketInfo_;
    // User address => Lottery ID => Ticket IDs
    mapping(address => mapping(uint256 => uint256[])) internal userTickets_;

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    /**
     * @notice  Restricts minting of new tokens to only the lotto contract.
     */
    modifier onlyLotto() {
        require(msg.sender == lotteryContract_, "Only Lotto can mint");
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    /**
     * @param   _uri A dynamic URI that enables individuals to view information
     *          around their NFT token. To see the information replace the
     *          `\{id\}` substring with the actual token type ID. For more info
     *          visit:
     *          https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     * @param   _lotto The address of the lotto contract. The lotto contract has
     *          elevated permissions on this contract.
     */
    constructor(string memory _uri, address _lotto) ERC1155(_uri) {
        // Only Lotto contract will be able to mint new tokens
        lotteryContract_ = _lotto;
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function getCurrentTicketId() external view returns (uint256) {
        return currentTicketId;
    }

    /**
     * @param   _ticketID: The unique ID of the ticket
     * @return  uint32[]: The chosen numbers for that ticket
     */
    function getTicketNumbers(uint256 _ticketID) external view returns (uint8) {
        return ticketInfo_[_ticketID].numbers;
    }

    /**
     * @param   _ticketID: The unique ID of the ticket
     * @return  address: Owner of ticket
     */
    function getOwnerOfTicket(uint256 _ticketID)
        external
        view
        returns (address)
    {
        return ticketInfo_[_ticketID].owner;
    }

    function getUserTicketIds(uint256 _lotteryId, address _user)
        external
        view
        returns (uint256[] memory)
    {
        return userTickets_[_user][_lotteryId];
    }

    function getUserTickets(uint256 _lotteryId, address _user)
        external
        view
        returns (TicketInfo[] memory)
    {
        uint256[] memory userTicketIds = userTickets_[_user][_lotteryId];
        TicketInfo[] memory userTickets = new TicketInfo[](
            userTicketIds.length
        );
        for (uint256 i = 0; i < userTicketIds.length; i++) {
            userTickets[i] = ticketInfo_[userTicketIds[i]];
        }
        return userTickets;
    }

    function getTicketInfo(uint256 _ticketID)
        external
        view
        returns (TicketInfo memory)
    {
        return ticketInfo_[_ticketID];
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS
    //-------------------------------------------------------------------------

    /**
     * @param   _to The address being minted to
     * @param   _numberOfTickets The number of NFT's to mint
     * @notice  Only the lotto contract is able to mint tokens. 
        // uint8[][] calldata _lottoNumbers
     */
    function Mint(
        address _to,
        uint256 _lotteryId,
        uint8 _numberOfTickets,
        uint8 _numbers
    ) external onlyLotto returns (uint256) {
        // Incrementing the tokenId counter
        currentTicketId = currentTicketId.add(1);
        uint256 ticketId = currentTicketId;
        // Storing the ticket information
        ticketInfo_[currentTicketId] = TicketInfo(
            _to,
            _numbers,
            _lotteryId,
            _numberOfTickets
        );
        userTickets_[_to][_lotteryId].push(currentTicketId);
        // Minting the ticket
        _mint(_to, ticketId, _numberOfTickets, msg.data);
        // Returns the ticket ID of minted ticket
        return ticketId;
    }

    /**
     * @return uint256: Total winning tickets
     * @return uint8: Final number
     * @return TicketInfo[]: TicketInfo of winning tickets
     */
    function getWinningTickets(
        uint256 _lotteryId,
        uint256 _randomNumber,
        uint256 _firstTicketId
    )
        external
        onlyLotto
        returns (
            uint256,
            uint8,
            TicketInfo[] memory
        )
    {
        uint8 finalNumber = uint8(_randomNumber.mod(100));
        uint256 totalTickets = 0;
        for (uint256 i = _firstTicketId; i <= currentTicketId; i++) {
            if (
                ticketInfo_[i].numbers == finalNumber &&
                ticketInfo_[i].lotteryId == _lotteryId
            ) {
                totalTickets = totalTickets.add(ticketInfo_[i].numberOfTickets);
                winningTickets.push(ticketInfo_[i]);
            }
        }
        return (totalTickets, finalNumber, winningTickets);
    }
}
