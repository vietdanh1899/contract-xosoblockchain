//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
// Imported OZ helper contracts
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// Inherited allowing for ownership of contract
import "@openzeppelin/contracts/access/Ownable.sol";
// Allows for intergration with ChainLink VRF
import "./IRandomNumberGenerator.sol";
// Interface for Lottery NFT to mint tokens
import "./ITicketNFT.sol";
// Safe math 
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SafeMath8.sol";
import "./ILottery.sol";

// TODO rename to Lottery when done
contract Lottery is ILottery, Ownable, Initializable, ReentrancyGuard {
    // Libraries 
    // Safe math
    using SafeMath for uint256;
    using SafeMath8 for uint8;
    // Safe ERC20
    using SafeERC20 for IERC20;
    // Address functionality 
    using Address for address;

    // Constants
    uint public constant MAX_NUMBER_TICKETS_PER_BUY = 100;
    uint256 public constant MAX_TREASURY_FEE = 5000; // 50%

    // State variables 
    address public operatorAddress;
    address public treasuryAddress;
    // Instance of USDT token (collateral currency for lotto)
    IERC20 internal usdt_;
    // Storing of the NFT
    ITicketNFT internal nft_;
    // Storing of the randomness generator 
    IRandomNumberGenerator internal randomGenerator_;
    // Request ID for random number
    bytes32 internal requestId_;
    // Counter for lottery IDs 
    uint256 private currentLotteryId;
    // The amount of usdt for prize money
    uint256 internal prizePool;    

    // Represents the status of the lottery
    enum Status { 
        Open,           // The lottery is open for ticket purchases 
        Closed,         // The lottery is no longer open for ticket purchases
        Completed       // The lottery has been closed and the numbers drawn
    }
    // All the needed info around a lottery
    struct LottoInfo {
        uint256 lotteryID;          // ID for lotto
        Status lotteryStatus;       // Status for lotto
        uint256 amountCollectedInUSDT;    // The amount of usdt for prize money
        uint256 costPerTicket;      // Cost per ticket in $usdt
        uint256 startingTimestamp;      // Block timestamp for start of lotto
        uint256 closingTimestamp;       // Block timestamp for end of entries
        uint8 winningNumbers;     // The winning numbers
        uint256 treasuryFee; // 500: 5% // 200: 2% // 50: 0.5%
        uint256 firstTicketId;  // Ticket Id of the first ticket in this lottery
    }
    // Lottery ID's to info
    mapping(uint256 => LottoInfo) internal allLotteries_;

    event LotteryOpen(uint256 lotteryId, uint256 ticketSupply);

    event LotteryClose(uint256 lotteryId, uint256 ticketSupply);

    //-------------------------------------------------------------------------
    // MODIFIERS
    //-------------------------------------------------------------------------

    modifier onlyRandomGenerator() {
        require(
            msg.sender == address(randomGenerator_),
            "Only random generator"
        );
        _;
    }

     modifier notContract() {
        require(!address(msg.sender).isContract(), "contract not allowed");
        require(msg.sender == tx.origin, "proxy contract not allowed");
       _;
    }

    modifier onlyOperator() {
        require(msg.sender == operatorAddress, "Not operator");
        _;
    }

    //-------------------------------------------------------------------------
    // CONSTRUCTOR
    //-------------------------------------------------------------------------

    constructor(
        address _usdt
    ) 
    {
        require(
            _usdt != address(0),
            "Contracts cannot be 0 address"
        );
        usdt_ = IERC20(_usdt);
    }

    function initialize(
        address _TicketNFT,
        address _IRandomNumberGenerator
    ) 
        external 
        initializer
        onlyOwner() 
    {
        require(
            _TicketNFT != address(0) &&
            _IRandomNumberGenerator != address(0),
            "Contracts cannot be 0 address"
        );
        nft_ = ITicketNFT(_TicketNFT);
        randomGenerator_ = IRandomNumberGenerator(_IRandomNumberGenerator);
    }

    //-------------------------------------------------------------------------
    // VIEW FUNCTIONS
    //-------------------------------------------------------------------------

    function costToBuyTickets(
        uint256 _lotteryId,
        uint256 _numberOfTickets
    ) 
        public
        view 
        returns(uint256 totalCost) 
    {
        uint256 pricePer = allLotteries_[_lotteryId].costPerTicket;
        totalCost = pricePer.mul(_numberOfTickets);
    }

    function getBasicLottoInfo(uint256 _lotteryId) external view returns(
        LottoInfo memory
    )
    {
        return(
            allLotteries_[_lotteryId]
        ); 
    }

    //-------------------------------------------------------------------------
    // STATE MODIFYING FUNCTIONS 
    //-------------------------------------------------------------------------

    /**
     * @param   _closingTimestamp The block timestamp after which no more tickets
     *          will be sold for the lottery. Note that this timestamp MUST
     *          be after the starting block timestamp. 
     * @param   _treasuryFee: treasury fee (10,000 = 100%, 100 = 1%)
     * @param   _costPerTicket: price of a ticket in USDT
     */
    function startLottery(
        uint256 _costPerTicket,
        uint256 _closingTimestamp,
        uint256 _treasuryFee
    )
        external
        onlyOwner()
        returns(uint256 lotteryId)
    {
        require(
            _costPerTicket != 0,
            "Prize or cost cannot be 0"
        );
        require(
            block.timestamp < _closingTimestamp,
            "Timestamps for lottery invalid"
        );
        require(
            (currentLotteryId == 0) || (allLotteries_[currentLotteryId].lotteryStatus == Status.Completed),
            "Not time to start lottery"
        );
        require(_treasuryFee <= MAX_TREASURY_FEE, "Treasury fee too high");

        // Incrementing lottery ID 
        currentLotteryId = currentLotteryId.add(1);
        lotteryId = currentLotteryId;
        // Saving data in struct
        LottoInfo memory newLottery = LottoInfo({
            lotteryID: lotteryId,
            lotteryStatus: Status.Open,
            amountCollectedInUSDT: 0,
            costPerTicket: _costPerTicket,
            startingTimestamp: block.timestamp,
            closingTimestamp: _closingTimestamp,
            winningNumbers: 111,   // 111 means haven't draw numbers
            treasuryFee: _treasuryFee,
            firstTicketId: nft_.getCurrentTicketId().add(1)
        });
        allLotteries_[lotteryId] = newLottery;

        // Emitting important information around new lottery.
        emit LotteryOpen(
            lotteryId, 
            nft_.getCurrentTicketId()
        );
    }

    function withdrawUSDT(uint256 _amount) external onlyOwner() {
        usdt_.transfer(
            msg.sender, 
            _amount
        );
    }

    //-------------------------------------------------------------------------
    // General Access Functions

    function buyTickets(
        uint256 _lotteryId,
        uint8 _numberOfTickets,
        uint8 _chosenNumbersForEachTicket
    )
        external
        notContract()
    {
        // Ensuring the lottery is within a valid time
        require(
            getCurrentTime() >= allLotteries_[_lotteryId].startingTimestamp,
            "Invalid time for mint:start"
        );
        require(
            getCurrentTime() < allLotteries_[_lotteryId].closingTimestamp,
            "Invalid time for mint:end"
        );
        if(allLotteries_[_lotteryId].lotteryStatus == Status.Completed) {
            if(allLotteries_[_lotteryId].startingTimestamp >= getCurrentTime()) {
                allLotteries_[_lotteryId].lotteryStatus = Status.Open;
            }
        }
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Open,
            "Lottery not in state for mint"
        );
        require(
            _numberOfTickets <= MAX_NUMBER_TICKETS_PER_BUY,
            "Batch mint too large"
        );
        require(
            _chosenNumbersForEachTicket <= 99 && _chosenNumbersForEachTicket >= 0,
            "Choose two-digit number"
        );
        // Getting the cost for the token purchase
        uint256 totalCost = costToBuyTickets(_lotteryId, _numberOfTickets);
        // Transfers the required cake to this contract
        usdt_.safeTransferFrom(
            msg.sender, 
            address(this), 
            totalCost
        );
        // Increment the total amount collected for the lottery round
        allLotteries_[_lotteryId].amountCollectedInUSDT += totalCost;
        prizePool = prizePool.add(totalCost);
        // Batch mints the user their tickets
        nft_.Mint(
            msg.sender,
            _lotteryId,
            _numberOfTickets,
            _chosenNumbersForEachTicket
        );
    }

    /**
     * @notice Close lottery
     * @param _lotteryId: lottery id
     * @dev Callable by operator
     */
    function closeLottery(uint256 _lotteryId) external onlyOperator nonReentrant {
        require(allLotteries_[_lotteryId].lotteryStatus == Status.Open, "Lottery not open");
        require(block.timestamp > allLotteries_[_lotteryId].closingTimestamp, "Lottery not over");

        allLotteries_[_lotteryId].lotteryStatus = Status.Closed;

        // Request a random number from the generator
        randomGenerator_.getRandomNumber(_lotteryId);
    }

    function numbersDrawn(
        uint256 _lotteryId,
        bytes32 _requestId, 
        uint256 _randomNumber
    ) 
        external
        onlyRandomGenerator
    {
        // Checks that the lottery is past the closing block
        require(
            allLotteries_[_lotteryId].closingTimestamp <= block.timestamp,
            "Cannot set winning numbers during lottery"
        );
        // Checks lottery numbers have not already been drawn
        require(
            allLotteries_[_lotteryId].lotteryStatus == Status.Closed,
            "Lottery State incorrect for draw"
        );

        if(requestId_ == _requestId) {
            // ... Transfer prize here
            (uint256 totalWinningTickets, ITicketNFT.TicketInfo[] memory winningTickets) = nft_.getWinningTickets(_lotteryId, _randomNumber, allLotteries_[_lotteryId].firstTicketId);
            if (totalWinningTickets > 0) {
                // Calculate the amount to share post-treasury fee
                uint256 amountToShareToWinners = 0;
                // Initializes the amount to withdraw to treasury
                uint256 amountToWithdrawToTreasury = 0;
                uint256 winAmountPerTicket = 0;
                winAmountPerTicket = prizePool * (10000 - allLotteries_[_lotteryId].treasuryFee) / 10000 / totalWinningTickets;
                amountToShareToWinners = winAmountPerTicket * totalWinningTickets;
                amountToWithdrawToTreasury = prizePool - amountToShareToWinners;

                // Transfer prize to winners
                for (uint256 i = 0; i < winningTickets.length; i++){
                    usdt_.safeTransfer(winningTickets[i].owner, winAmountPerTicket * winningTickets[i].numberOfTickets);
                }

                // Transfer fee to treasury address
                usdt_.safeTransfer(treasuryAddress, amountToWithdrawToTreasury);
            }

            // Set lottery status completed
            allLotteries_[_lotteryId].lotteryStatus = Status.Completed;
        }

        emit LotteryClose(_lotteryId, nft_.getCurrentTicketId());
    }


    /**
     * @notice Set operator, treasury, and injector addresses
     * @dev Only callable by owner
     * @param _operatorAddress: address of the operator
     */
    function setOperatorAndTreasuryAddresses(
        address _operatorAddress,
        address _treasuryAddress
    ) external onlyOwner {
        require(_operatorAddress != address(0), "Cannot be zero address");
        require(_treasuryAddress != address(0), "Cannot be zero address");

        operatorAddress = _operatorAddress;
        treasuryAddress = _treasuryAddress;
    }

    //-------------------------------------------------------------------------
    // INTERNAL FUNCTIONS 
    //-------------------------------------------------------------------------

    function getCurrentTime() internal view returns (uint256) {
        return block.timestamp;
    }
}
