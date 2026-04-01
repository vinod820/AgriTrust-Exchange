// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Reputation is Ownable {
    struct UserReputation {
        bool exists;
        uint256 successfulTransactions;
        uint256 failedTransactions;
        uint256 totalRatings;
        uint256 reviewCount;
    }

    mapping(address => UserReputation) private reputations;
    address public supplyChain;

    event SupplyChainUpdated(address indexed supplyChainAddress);
    event UserRegistered(address indexed user);
    event ReviewAdded(address indexed user, uint8 rating);
    event TransactionRecorded(address indexed user, bool success);

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

    function registerUser(address user) external onlyAuthorized {
        require(user != address(0), "Invalid user");
        UserReputation storage profile = reputations[user];
        if (!profile.exists) {
            profile.exists = true;
            emit UserRegistered(user);
        }
    }

    function addReview(address user, uint8 rating) external onlyAuthorized {
        require(rating >= 1 && rating <= 5, "Invalid rating");
        UserReputation storage profile = reputations[user];
        if (!profile.exists) {
            profile.exists = true;
            emit UserRegistered(user);
        }
        profile.totalRatings += rating;
        profile.reviewCount += 1;
        emit ReviewAdded(user, rating);
    }

    function recordTransactionSuccess(address user) external onlyAuthorized {
        UserReputation storage profile = reputations[user];
        if (!profile.exists) {
            profile.exists = true;
            emit UserRegistered(user);
        }
        profile.successfulTransactions += 1;
        emit TransactionRecorded(user, true);
    }

    function recordTransactionFailure(address user) external onlyAuthorized {
        UserReputation storage profile = reputations[user];
        if (!profile.exists) {
            profile.exists = true;
            emit UserRegistered(user);
        }
        profile.failedTransactions += 1;
        emit TransactionRecorded(user, false);
    }

    function getReputation(address user) external view returns (UserReputation memory) {
        return reputations[user];
    }

    function getAverageRating(address user) public view returns (uint256) {
        UserReputation memory profile = reputations[user];
        if (profile.reviewCount == 0) {
            return 0;
        }
        return (profile.totalRatings * 100) / profile.reviewCount;
    }

    function getReputationScore(address user) external view returns (uint256) {
        UserReputation memory profile = reputations[user];
        uint256 successWeight = profile.successfulTransactions * 10;
        uint256 ratingWeight = getAverageRating(user);
        uint256 penalty = profile.failedTransactions * 15;
        if (successWeight + ratingWeight <= penalty) {
            return 0;
        }
        return successWeight + ratingWeight - penalty;
    }
}

