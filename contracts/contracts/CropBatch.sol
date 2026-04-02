// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IKrishiStructs.sol";

contract CropBatch is IKrishiStructs {
    uint256 public nextBatchId = 1;
    address public immutable owner;
    mapping(address => bool) public qualityOracles;
    mapping(uint256 => BatchData) private batches;

    event BatchCreated(
        uint256 indexed batchId,
        address indexed farmer,
        string cropType,
        uint256 quantityKg,
        string ipfsHash,
        bytes32 geoHash
    );
    event QualityUpdated(uint256 indexed batchId, uint256 qualityScore, BatchStatus status, address indexed oracle);
    event BatchReadyForSale(uint256 indexed batchId);
    event BatchStatusUpdated(uint256 indexed batchId, BatchStatus status);
    event QualityOracleSet(address indexed oracle, bool approved);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyFarmer(uint256 batchId) {
        require(batches[batchId].farmer == msg.sender, "Only farmer");
        _;
    }

    modifier onlyQualityOracle() {
        require(qualityOracles[msg.sender] || msg.sender == owner, "Only quality oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setQualityOracle(address oracle, bool approved) external onlyOwner {
        qualityOracles[oracle] = approved;
        emit QualityOracleSet(oracle, approved);
    }

    function createBatch(
        string calldata cropType,
        uint256 quantityKg,
        string calldata ipfsHash,
        bytes32 geoHash
    ) external returns (uint256 batchId) {
        require(bytes(cropType).length > 0, "Crop type required");
        require(quantityKg > 0, "Quantity required");
        require(bytes(ipfsHash).length > 0, "IPFS hash required");

        batchId = nextBatchId++;
        batches[batchId] = BatchData({
            batchId: batchId,
            farmer: msg.sender,
            cropType: cropType,
            quantityKg: quantityKg,
            qualityScore: 0,
            ipfsHash: ipfsHash,
            geoHash: geoHash,
            createdAt: block.timestamp,
            status: BatchStatus.Draft
        });

        emit BatchCreated(batchId, msg.sender, cropType, quantityKg, ipfsHash, geoHash);
    }

    function updateQuality(uint256 batchId, uint256 qualityScore) external onlyQualityOracle {
        require(batches[batchId].batchId != 0, "Batch missing");
        require(qualityScore <= 100, "Invalid score");

        batches[batchId].qualityScore = qualityScore;
        batches[batchId].status = BatchStatus.QualityVerified;

        emit QualityUpdated(batchId, qualityScore, BatchStatus.QualityVerified, msg.sender);
    }

    function markReadyForSale(uint256 batchId) external onlyFarmer(batchId) {
        require(batches[batchId].batchId != 0, "Batch missing");
        require(
            batches[batchId].status == BatchStatus.QualityVerified || batches[batchId].status == BatchStatus.Draft,
            "Invalid batch state"
        );

        batches[batchId].status = BatchStatus.ReadyForSale;
        emit BatchReadyForSale(batchId);
    }

    function setBatchStatus(uint256 batchId, BatchStatus status) external onlyOwner {
        require(batches[batchId].batchId != 0, "Batch missing");
        batches[batchId].status = status;
        emit BatchStatusUpdated(batchId, status);
    }

    function getBatch(uint256 batchId) external view returns (BatchData memory) {
        require(batches[batchId].batchId != 0, "Batch missing");
        return batches[batchId];
    }
}
