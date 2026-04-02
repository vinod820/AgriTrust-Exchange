// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IKrishiStructs {
    enum BatchStatus {
        Draft,
        QualityVerified,
        ReadyForSale,
        Listed,
        Reserved,
        Shipped,
        Delivered,
        Closed,
        Flagged
    }

    enum ListingStatus {
        Inactive,
        Active,
        SoldOut,
        Removed
    }

    enum OrderStatus {
        None,
        Created,
        Shipped,
        Delivered,
        Disputed,
        Released,
        Refunded,
        Cancelled
    }

    struct BatchData {
        uint256 batchId;
        address farmer;
        string cropType;
        uint256 quantityKg;
        uint256 qualityScore;
        string ipfsHash;
        bytes32 geoHash;
        uint256 createdAt;
        BatchStatus status;
    }
}
