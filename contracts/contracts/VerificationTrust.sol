// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract VerificationTrust {
    address public immutable admin;

    struct VerificationRecord {
        string videoHash;
        string expertResult;
        uint256 aiQualityScore;
        bool fraudFlagged;
        uint256 timestamp;
    }

    struct TrustProfile {
        uint256 trustScore;
        uint256 successfulDeliveries;
        uint256 disputeCount;
        uint256 fraudFlags;
        bool exists;
    }

    mapping(uint256 => VerificationRecord[]) private batchVerifications;
    mapping(address => TrustProfile) public trustProfiles;

    event VerificationAdded(uint256 indexed batchId, string videoHash, string expertResult, uint256 aiQualityScore);
    event TrustScoreUpdated(address indexed actor, uint256 trustScore, uint256 successfulDeliveries, uint256 disputes);
    event FraudFlagged(uint256 indexed batchId, address indexed actor, string reason);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function addVerification(
        uint256 batchId,
        string calldata videoHash,
        string calldata expertResult,
        uint256 aiQualityScore
    ) external onlyAdmin {
        require(aiQualityScore <= 100, "Invalid quality score");

        batchVerifications[batchId].push(
            VerificationRecord({
                videoHash: videoHash,
                expertResult: expertResult,
                aiQualityScore: aiQualityScore,
                fraudFlagged: false,
                timestamp: block.timestamp
            })
        );

        emit VerificationAdded(batchId, videoHash, expertResult, aiQualityScore);
    }

    function updateTrustScore(
        address actor,
        uint256 trustScore,
        uint256 successfulDeliveries,
        uint256 disputeCount
    ) external onlyAdmin {
        trustProfiles[actor] = TrustProfile({
            trustScore: trustScore,
            successfulDeliveries: successfulDeliveries,
            disputeCount: disputeCount,
            fraudFlags: trustProfiles[actor].fraudFlags,
            exists: true
        });

        emit TrustScoreUpdated(actor, trustScore, successfulDeliveries, disputeCount);
    }

    function flagFraud(uint256 batchId, address actor, string calldata reason) external onlyAdmin {
        uint256 len = batchVerifications[batchId].length;
        require(len > 0, "Verification missing");

        batchVerifications[batchId][len - 1].fraudFlagged = true;
        trustProfiles[actor].fraudFlags += 1;
        trustProfiles[actor].exists = true;

        emit FraudFlagged(batchId, actor, reason);
    }

    function getLatestVerification(uint256 batchId) external view returns (VerificationRecord memory) {
        uint256 len = batchVerifications[batchId].length;
        require(len > 0, "Verification missing");
        return batchVerifications[batchId][len - 1];
    }

    function getVerificationCount(uint256 batchId) external view returns (uint256) {
        return batchVerifications[batchId].length;
    }
}
