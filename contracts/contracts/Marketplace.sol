// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CropBatch.sol";
import "./interfaces/IKrishiStructs.sol";

contract Marketplace is IKrishiStructs {
    CropBatch public immutable cropBatch;
    address public immutable owner;
    mapping(address => bool) public authorizedManagers;

    struct Listing {
        uint256 batchId;
        address farmer;
        uint256 pricePerKg;
        uint256 availableQuantityKg;
        ListingStatus status;
        uint256 updatedAt;
    }

    mapping(uint256 => Listing) public listings;

    event BatchListed(uint256 indexed batchId, address indexed farmer, uint256 pricePerKg, uint256 availableQuantityKg);
    event ListingPriceUpdated(uint256 indexed batchId, uint256 newPricePerKg);
    event ListingQuantityUpdated(uint256 indexed batchId, uint256 remainingQuantityKg);
    event ListingRemoved(uint256 indexed batchId);
    event AuthorizedManagerSet(address indexed manager, bool approved);

    constructor(address cropBatchAddress) {
        cropBatch = CropBatch(cropBatchAddress);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyBatchFarmer(uint256 batchId) {
        BatchData memory batch = cropBatch.getBatch(batchId);
        require(batch.farmer == msg.sender, "Only farmer");
        _;
    }

    modifier onlyAuthorizedManager() {
        require(authorizedManagers[msg.sender] || msg.sender == owner, "Not authorized");
        _;
    }

    function setAuthorizedManager(address manager, bool approved) external onlyOwner {
        authorizedManagers[manager] = approved;
        emit AuthorizedManagerSet(manager, approved);
    }

    function listBatch(uint256 batchId, uint256 pricePerKg, uint256 availableQuantityKg) external onlyBatchFarmer(batchId) {
        BatchData memory batch = cropBatch.getBatch(batchId);
        require(batch.status == BatchStatus.ReadyForSale, "Batch not sale ready");
        require(pricePerKg > 0, "Price required");
        require(availableQuantityKg > 0 && availableQuantityKg <= batch.quantityKg, "Invalid quantity");

        listings[batchId] = Listing({
            batchId: batchId,
            farmer: msg.sender,
            pricePerKg: pricePerKg,
            availableQuantityKg: availableQuantityKg,
            status: ListingStatus.Active,
            updatedAt: block.timestamp
        });

        emit BatchListed(batchId, msg.sender, pricePerKg, availableQuantityKg);
    }

    function updatePrice(uint256 batchId, uint256 newPricePerKg) external onlyBatchFarmer(batchId) {
        require(listings[batchId].status == ListingStatus.Active, "Listing inactive");
        require(newPricePerKg > 0, "Price required");

        listings[batchId].pricePerKg = newPricePerKg;
        listings[batchId].updatedAt = block.timestamp;
        emit ListingPriceUpdated(batchId, newPricePerKg);
    }

    function reduceAvailableQuantity(uint256 batchId, uint256 quantityKg) external onlyAuthorizedManager {
        require(listings[batchId].status == ListingStatus.Active, "Listing inactive");
        require(quantityKg > 0 && quantityKg <= listings[batchId].availableQuantityKg, "Invalid quantity");

        listings[batchId].availableQuantityKg -= quantityKg;
        listings[batchId].updatedAt = block.timestamp;

        if (listings[batchId].availableQuantityKg == 0) {
            listings[batchId].status = ListingStatus.SoldOut;
        }

        emit ListingQuantityUpdated(batchId, listings[batchId].availableQuantityKg);
    }

    function removeListing(uint256 batchId) external onlyBatchFarmer(batchId) {
        require(listings[batchId].status == ListingStatus.Active, "Listing inactive");
        listings[batchId].status = ListingStatus.Removed;
        listings[batchId].updatedAt = block.timestamp;
        emit ListingRemoved(batchId);
    }

    function getListing(uint256 batchId) external view returns (Listing memory) {
        return listings[batchId];
    }
}
