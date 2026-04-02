// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Marketplace.sol";
import "./VerificationTrust.sol";
import "./interfaces/IKrishiStructs.sol";

contract EscrowSettlement is IKrishiStructs {
    Marketplace public immutable marketplace;
    VerificationTrust public immutable verificationTrust;
    address public immutable admin;
    uint256 public nextOrderId = 1;

    struct Order {
        uint256 orderId;
        uint256 batchId;
        address buyer;
        address farmer;
        uint256 quantityKg;
        uint256 amount;
        uint256 createdAt;
        uint256 deliveryDeadline;
        OrderStatus status;
        bool deliveryConfirmed;
        bool disputeRaised;
        string disputeReason;
    }

    mapping(uint256 => Order) public orders;

    event OrderCreated(
        uint256 indexed orderId,
        uint256 indexed batchId,
        address indexed buyer,
        address farmer,
        uint256 quantityKg,
        uint256 amount,
        uint256 deliveryDeadline
    );
    event OrderShipped(uint256 indexed orderId);
    event DeliveryConfirmed(uint256 indexed orderId);
    event DisputeRaised(uint256 indexed orderId, string reason);
    event PaymentReleased(uint256 indexed orderId, uint256 amount);
    event BuyerRefunded(uint256 indexed orderId, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyBuyer(uint256 orderId) {
        require(orders[orderId].buyer == msg.sender, "Only buyer");
        _;
    }

    modifier onlyFarmer(uint256 orderId) {
        require(orders[orderId].farmer == msg.sender, "Only farmer");
        _;
    }

    constructor(address marketplaceAddress, address verificationTrustAddress) {
        marketplace = Marketplace(marketplaceAddress);
        verificationTrust = VerificationTrust(verificationTrustAddress);
        admin = msg.sender;
    }

    function createOrder(uint256 batchId, uint256 quantityKg, uint256 deliveryWindowSeconds) external payable returns (uint256) {
        Marketplace.Listing memory listing = marketplace.getListing(batchId);
        require(listing.status == ListingStatus.Active, "Listing inactive");
        require(quantityKg > 0 && quantityKg <= listing.availableQuantityKg, "Invalid quantity");

        uint256 expectedAmount = listing.pricePerKg * quantityKg;
        require(msg.value == expectedAmount, "Incorrect payment");

        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            orderId: orderId,
            batchId: batchId,
            buyer: msg.sender,
            farmer: listing.farmer,
            quantityKg: quantityKg,
            amount: msg.value,
            createdAt: block.timestamp,
            deliveryDeadline: block.timestamp + deliveryWindowSeconds,
            status: OrderStatus.Created,
            deliveryConfirmed: false,
            disputeRaised: false,
            disputeReason: ""
        });

        marketplace.reduceAvailableQuantity(batchId, quantityKg);

        emit OrderCreated(
            orderId,
            batchId,
            msg.sender,
            listing.farmer,
            quantityKg,
            msg.value,
            block.timestamp + deliveryWindowSeconds
        );
        return orderId;
    }

    function markShipped(uint256 orderId) external onlyFarmer(orderId) {
        require(orders[orderId].status == OrderStatus.Created, "Invalid status");
        orders[orderId].status = OrderStatus.Shipped;
        emit OrderShipped(orderId);
    }

    function confirmDelivery(uint256 orderId) external onlyBuyer(orderId) {
        require(
            orders[orderId].status == OrderStatus.Created || orders[orderId].status == OrderStatus.Shipped,
            "Invalid status"
        );

        orders[orderId].deliveryConfirmed = true;
        orders[orderId].status = OrderStatus.Delivered;
        emit DeliveryConfirmed(orderId);
    }

    function raiseDispute(uint256 orderId, string calldata reason) external onlyBuyer(orderId) {
        require(
            orders[orderId].status == OrderStatus.Created ||
                orders[orderId].status == OrderStatus.Shipped ||
                orders[orderId].status == OrderStatus.Delivered,
            "Invalid status"
        );

        orders[orderId].disputeRaised = true;
        orders[orderId].disputeReason = reason;
        orders[orderId].status = OrderStatus.Disputed;

        emit DisputeRaised(orderId, reason);
    }

    function releasePayment(uint256 orderId) external {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Delivered || order.status == OrderStatus.Shipped, "Invalid status");
        require(
            msg.sender == order.buyer || msg.sender == admin || block.timestamp > order.deliveryDeadline,
            "Not authorized"
        );
        require(!order.disputeRaised, "Dispute open");

        order.status = OrderStatus.Released;
        payable(order.farmer).transfer(order.amount);

        emit PaymentReleased(orderId, order.amount);
    }

    function refundBuyer(uint256 orderId) external onlyAdmin {
        Order storage order = orders[orderId];
        require(order.status == OrderStatus.Disputed, "Not disputed");

        order.status = OrderStatus.Refunded;
        payable(order.buyer).transfer(order.amount);

        emit BuyerRefunded(orderId, order.amount);
    }
}
