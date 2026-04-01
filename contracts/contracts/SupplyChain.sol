// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./Escrow.sol";
import "./Reputation.sol";

contract SupplyChain is Ownable, ReentrancyGuard {
    enum Role {
        None,
        Farmer,
        Distributor,
        Retailer,
        Consumer,
        Arbitrator
    }

    enum ProductState {
        None,
        Produced,
        ListedByFarmer,
        PurchasedByDistributor,
        ShippedByFarmer,
        ReceivedByDistributor,
        ProcessedByDistributor,
        PackagedByDistributor,
        ListedByDistributor,
        PurchasedByRetailer,
        ShippedByDistributor,
        ReceivedByRetailer,
        ListedByRetailer,
        PurchasedByConsumer,
        Completed,
        Disputed
    }

    struct Product {
        uint256 id;
        string batchId;
        string metadataURI;
        address farmer;
        address currentOwner;
        address latestBuyer;
        uint256 price;
        uint256 shippingDeadline;
        uint256 harvestDate;
        string qualityGrade;
        ProductState state;
        bool exists;
    }

    uint256 public nextProductId;
    Escrow public immutable escrow;
    Reputation public immutable reputation;

    mapping(address => Role) public roles;
    mapping(address => bool) public verifiedUsers;
    mapping(uint256 => Product) public products;
    mapping(uint256 => uint256) public escrowByProduct;

    event UserRegistered(address indexed user, Role role);
    event UserVerified(address indexed user, bool verified);
    event ProductCreated(uint256 indexed productId, string batchId, address indexed farmer);
    event ProductStateChanged(uint256 indexed productId, ProductState state, address indexed actor);
    event ProductListed(uint256 indexed productId, uint256 price, address indexed seller);
    event ProductPurchased(uint256 indexed productId, uint256 escrowId, address indexed buyer, uint256 amount);
    event BatchOperationCreated(uint256 indexed count, uint256 timestamp);

    modifier onlyRole(Role expectedRole) {
        require(roles[msg.sender] == expectedRole, "Incorrect role");
        require(verifiedUsers[msg.sender], "User not verified");
        _;
    }

    modifier productExists(uint256 productId) {
        require(products[productId].exists, "Unknown product");
        _;
    }

    constructor(address escrowAddress, address reputationAddress, address initialOwner) Ownable(initialOwner) {
        escrow = Escrow(escrowAddress);
        reputation = Reputation(reputationAddress);
    }

    function registerUser(Role role) external {
        require(role != Role.None, "Invalid role");
        require(roles[msg.sender] == Role.None, "Already registered");
        roles[msg.sender] = role;
        reputation.registerUser(msg.sender);
        emit UserRegistered(msg.sender, role);
    }

    function verifyUser(address user, bool verified) external onlyOwner {
        verifiedUsers[user] = verified;
        emit UserVerified(user, verified);
    }

    function produceItemByFarmer(
        string calldata batchId,
        string calldata metadataURI,
        uint256 price,
        uint256 shippingDeadline,
        uint256 harvestDate,
        string calldata qualityGrade
    ) external onlyRole(Role.Farmer) returns (uint256) {
        require(bytes(batchId).length > 0, "Batch required");
        require(shippingDeadline > block.timestamp, "Deadline in past");
        require(price > 0, "Price must be positive");

        nextProductId += 1;
        products[nextProductId] = Product({
            id: nextProductId,
            batchId: batchId,
            metadataURI: metadataURI,
            farmer: msg.sender,
            currentOwner: msg.sender,
            latestBuyer: address(0),
            price: price,
            shippingDeadline: shippingDeadline,
            harvestDate: harvestDate,
            qualityGrade: qualityGrade,
            state: ProductState.Produced,
            exists: true
        });

        emit ProductCreated(nextProductId, batchId, msg.sender);
        return nextProductId;
    }

    function sellItemByFarmer(uint256 productId, uint256 price) external onlyRole(Role.Farmer) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.Produced || product.state == ProductState.ReceivedByRetailer, "Invalid state");
        product.price = price;
        product.state = ProductState.ListedByFarmer;
        emit ProductListed(productId, price, msg.sender);
    }

    function purchaseItemByDistributor(uint256 productId) external payable onlyRole(Role.Distributor) nonReentrant productExists(productId) {
        _purchase(productId, ProductState.ListedByFarmer, ProductState.PurchasedByDistributor);
    }

    function shippedItemByFarmer(uint256 productId) external onlyRole(Role.Farmer) productExists(productId) {
        Product storage product = products[productId];
        require(product.farmer == msg.sender, "Only farmer");
        require(product.state == ProductState.PurchasedByDistributor, "Invalid state");
        product.state = ProductState.ShippedByFarmer;
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function receivedItemByDistributor(uint256 productId) external onlyRole(Role.Distributor) productExists(productId) {
        Product storage product = products[productId];
        require(product.latestBuyer == msg.sender, "Only buyer");
        require(product.state == ProductState.ShippedByFarmer, "Invalid state");
        product.currentOwner = msg.sender;
        product.state = ProductState.ReceivedByDistributor;
        _releaseEscrow(productId, product.farmer);
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function processedItemByDistributor(uint256 productId, string calldata qualityGrade) external onlyRole(Role.Distributor) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.ReceivedByDistributor, "Invalid state");
        product.qualityGrade = qualityGrade;
        product.state = ProductState.ProcessedByDistributor;
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function packageItemByDistributor(uint256 productId) external onlyRole(Role.Distributor) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.ProcessedByDistributor, "Invalid state");
        product.state = ProductState.PackagedByDistributor;
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function sellItemByDistributor(uint256 productId, uint256 price) external onlyRole(Role.Distributor) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.PackagedByDistributor, "Invalid state");
        product.price = price;
        product.state = ProductState.ListedByDistributor;
        emit ProductListed(productId, price, msg.sender);
    }

    function purchaseItemByRetailer(uint256 productId) external payable onlyRole(Role.Retailer) nonReentrant productExists(productId) {
        _purchase(productId, ProductState.ListedByDistributor, ProductState.PurchasedByRetailer);
    }

    function shippedItemByDistributor(uint256 productId) external onlyRole(Role.Distributor) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.PurchasedByRetailer, "Invalid state");
        product.state = ProductState.ShippedByDistributor;
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function receivedItemByRetailer(uint256 productId) external onlyRole(Role.Retailer) productExists(productId) {
        Product storage product = products[productId];
        require(product.latestBuyer == msg.sender, "Only buyer");
        require(product.state == ProductState.ShippedByDistributor, "Invalid state");
        address seller = product.currentOwner;
        product.currentOwner = msg.sender;
        product.state = ProductState.ReceivedByRetailer;
        _releaseEscrow(productId, seller);
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function sellItemByRetailer(uint256 productId, uint256 price) external onlyRole(Role.Retailer) productExists(productId) {
        Product storage product = products[productId];
        require(product.currentOwner == msg.sender, "Not product owner");
        require(product.state == ProductState.ReceivedByRetailer, "Invalid state");
        product.price = price;
        product.state = ProductState.ListedByRetailer;
        emit ProductListed(productId, price, msg.sender);
    }

    function purchaseItemByConsumer(uint256 productId) external payable onlyRole(Role.Consumer) nonReentrant productExists(productId) {
        _purchase(productId, ProductState.ListedByRetailer, ProductState.PurchasedByConsumer);
    }

    function confirmConsumerReceipt(uint256 productId) external onlyRole(Role.Consumer) productExists(productId) {
        Product storage product = products[productId];
        require(product.latestBuyer == msg.sender, "Only buyer");
        require(product.state == ProductState.PurchasedByConsumer, "Invalid state");
        address seller = product.currentOwner;
        product.currentOwner = msg.sender;
        product.state = ProductState.Completed;
        _releaseEscrow(productId, seller);
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function openDispute(uint256 productId, string calldata reason) external productExists(productId) {
        Product storage product = products[productId];
        require(msg.sender == product.currentOwner || msg.sender == product.latestBuyer || msg.sender == owner(), "Not involved");
        uint256 escrowId = escrowByProduct[productId];
        require(escrowId != 0, "No escrow");
        product.state = ProductState.Disputed;
        escrow.openDispute(escrowId, reason);
        emit ProductStateChanged(productId, product.state, msg.sender);
    }

    function resolveDispute(uint256 productId, bool releaseToSeller) external onlyOwner productExists(productId) {
        uint256 escrowId = escrowByProduct[productId];
        require(escrowId != 0, "No escrow");
        escrow.resolveDispute(escrowId, releaseToSeller);
        if (releaseToSeller) {
            reputation.recordTransactionSuccess(products[productId].currentOwner);
        } else {
            reputation.recordTransactionFailure(products[productId].currentOwner);
        }
        products[productId].state = ProductState.Completed;
        emit ProductStateChanged(productId, products[productId].state, msg.sender);
    }

    function createBatchOperation(uint256[] calldata productIds) external onlyOwner {
        require(productIds.length > 0 && productIds.length <= 50, "Batch size invalid");
        emit BatchOperationCreated(productIds.length, block.timestamp);
    }

    function _purchase(uint256 productId, ProductState expectedState, ProductState purchasedState) internal {
        Product storage product = products[productId];
        require(product.state == expectedState, "Product not listed");
        require(msg.value == product.price, "Incorrect payment");

        uint256 escrowId = escrow.createEscrow{value: msg.value}(productId, msg.sender, product.currentOwner);
        escrowByProduct[productId] = escrowId;
        product.latestBuyer = msg.sender;
        product.state = purchasedState;
        emit ProductPurchased(productId, escrowId, msg.sender, msg.value);
    }

    function _releaseEscrow(uint256 productId, address seller) internal {
        uint256 escrowId = escrowByProduct[productId];
        if (escrowId != 0) {
            escrow.release(escrowId);
            reputation.recordTransactionSuccess(seller);
        }
    }
}
