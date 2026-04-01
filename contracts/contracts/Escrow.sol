// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is Ownable, ReentrancyGuard {
    enum Status {
        None,
        Locked,
        Released,
        Refunded,
        Disputed
    }

    struct EscrowRecord {
        uint256 id;
        uint256 productId;
        address buyer;
        address seller;
        uint256 amount;
        Status status;
        string disputeReason;
    }

    uint256 public nextEscrowId;
    address public supplyChain;
    mapping(uint256 => EscrowRecord) public escrows;

    event SupplyChainUpdated(address indexed supplyChainAddress);
    event EscrowCreated(uint256 indexed escrowId, uint256 indexed productId, address buyer, address seller, uint256 amount);
    event EscrowReleased(uint256 indexed escrowId);
    event EscrowRefunded(uint256 indexed escrowId);
    event DisputeOpened(uint256 indexed escrowId, string reason);
    event DisputeResolved(uint256 indexed escrowId, bool releasedToSeller);

    modifier onlyAuthorized() {
        require(msg.sender == owner() || msg.sender == supplyChain, "Not authorized");
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setSupplyChain(address supplyChainAddress) external onlyOwner {
        require(supplyChainAddress != address(0), "Invalid address");
        supplyChain = supplyChainAddress;
        emit SupplyChainUpdated(supplyChainAddress);
    }

    function createEscrow(uint256 productId, address buyer, address seller) external payable onlyAuthorized returns (uint256) {
        require(msg.value > 0, "Escrow requires value");
        require(buyer != address(0) && seller != address(0), "Invalid parties");

        nextEscrowId += 1;
        escrows[nextEscrowId] = EscrowRecord({
            id: nextEscrowId,
            productId: productId,
            buyer: buyer,
            seller: seller,
            amount: msg.value,
            status: Status.Locked,
            disputeReason: ""
        });

        emit EscrowCreated(nextEscrowId, productId, buyer, seller, msg.value);
        return nextEscrowId;
    }

    function release(uint256 escrowId) external nonReentrant onlyAuthorized {
        EscrowRecord storage record = escrows[escrowId];
        require(record.status == Status.Locked, "Escrow not locked");
        record.status = Status.Released;
        (bool sent, ) = payable(record.seller).call{value: record.amount}("");
        require(sent, "Seller payout failed");
        emit EscrowReleased(escrowId);
    }

    function refund(uint256 escrowId) external nonReentrant onlyAuthorized {
        EscrowRecord storage record = escrows[escrowId];
        require(record.status == Status.Locked || record.status == Status.Disputed, "Escrow not refundable");
        record.status = Status.Refunded;
        (bool sent, ) = payable(record.buyer).call{value: record.amount}("");
        require(sent, "Buyer refund failed");
        emit EscrowRefunded(escrowId);
    }

    function openDispute(uint256 escrowId, string calldata reason) external {
        EscrowRecord storage record = escrows[escrowId];
        require(record.status == Status.Locked, "Escrow cannot be disputed");
        require(
            msg.sender == record.buyer || msg.sender == record.seller || msg.sender == owner() || msg.sender == supplyChain,
            "Only buyer, seller, or admin"
        );
        record.status = Status.Disputed;
        record.disputeReason = reason;
        emit DisputeOpened(escrowId, reason);
    }

    function resolveDispute(uint256 escrowId, bool releaseToSeller) external onlyOwner {
        EscrowRecord storage record = escrows[escrowId];
        require(record.status == Status.Disputed, "Dispute not open");
        if (releaseToSeller) {
            record.status = Status.Released;
            (bool sentToSeller, ) = payable(record.seller).call{value: record.amount}("");
            require(sentToSeller, "Seller payout failed");
        } else {
            record.status = Status.Refunded;
            (bool sentToBuyer, ) = payable(record.buyer).call{value: record.amount}("");
            require(sentToBuyer, "Buyer refund failed");
        }
        emit DisputeResolved(escrowId, releaseToSeller);
    }
}
