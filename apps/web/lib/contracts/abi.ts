export const cropBatchAbi = [
  "event BatchCreated(uint256 indexed batchId,address indexed farmer,string cropType,uint256 quantityKg,string ipfsHash,bytes32 geoHash)",
  "event BatchReadyForSale(uint256 indexed batchId)",
  "event QualityUpdated(uint256 indexed batchId,uint256 qualityScore,uint8 status,address indexed oracle)",
  "function createBatch(string cropType,uint256 quantityKg,string ipfsHash,bytes32 geoHash) returns (uint256 batchId)",
  "function markReadyForSale(uint256 batchId)",
  "function getBatch(uint256 batchId) view returns ((uint256 batchId,address farmer,string cropType,uint256 quantityKg,uint256 qualityScore,string ipfsHash,bytes32 geoHash,uint256 createdAt,uint8 status))",
  "function nextBatchId() view returns (uint256)"
] as const;

export const marketplaceAbi = [
  "event BatchListed(uint256 indexed batchId,address indexed farmer,uint256 pricePerKg,uint256 availableQuantityKg)",
  "event ListingPriceUpdated(uint256 indexed batchId,uint256 newPricePerKg)",
  "event ListingQuantityUpdated(uint256 indexed batchId,uint256 remainingQuantityKg)",
  "event AuthorizedManagerSet(address indexed manager,bool approved)",
  "function listBatch(uint256 batchId,uint256 pricePerKg,uint256 availableQuantityKg)",
  "function getListing(uint256 batchId) view returns ((uint256 batchId,address farmer,uint256 pricePerKg,uint256 availableQuantityKg,uint8 status,uint256 updatedAt))",
  "function authorizedManagers(address manager) view returns (bool)"
] as const;

export const escrowSettlementAbi = [
  "event OrderCreated(uint256 indexed orderId,uint256 indexed batchId,address indexed buyer,address farmer,uint256 quantityKg,uint256 amount,uint256 deliveryDeadline)",
  "event OrderShipped(uint256 indexed orderId)",
  "event DeliveryConfirmed(uint256 indexed orderId)",
  "event PaymentReleased(uint256 indexed orderId,uint256 amount)",
  "event DisputeRaised(uint256 indexed orderId,string reason)",
  "event BuyerRefunded(uint256 indexed orderId,uint256 amount)",
  "function createOrder(uint256 batchId,uint256 quantityKg,uint256 deliveryWindowSeconds) payable returns (uint256)",
  "function markShipped(uint256 orderId)",
  "function confirmDelivery(uint256 orderId)",
  "function raiseDispute(uint256 orderId,string reason)",
  "function releasePayment(uint256 orderId)",
  "function refundBuyer(uint256 orderId)",
  "function orders(uint256 orderId) view returns (uint256 orderId,uint256 batchId,address buyer,address farmer,uint256 quantityKg,uint256 amount,uint256 createdAt,uint256 deliveryDeadline,uint8 status,bool deliveryConfirmed,bool disputeRaised,string disputeReason)",
  "function nextOrderId() view returns (uint256)"
] as const;

export const verificationTrustAbi = [
  "event VerificationAdded(uint256 indexed batchId,string videoHash,string expertResult,uint256 aiQualityScore)",
  "event TrustScoreUpdated(address indexed actor,uint256 trustScore,uint256 successfulDeliveries,uint256 disputes)",
  "event FraudFlagged(uint256 indexed batchId,address indexed actor,string reason)",
  "function addVerification(uint256 batchId,string videoHash,string expertResult,uint256 aiQualityScore)",
  "function admin() view returns (address)",
  "function trustProfiles(address actor) view returns (uint256 trustScore,uint256 successfulDeliveries,uint256 disputeCount,uint256 fraudFlags,bool exists)",
  "function getLatestVerification(uint256 batchId) view returns (string videoHash,string expertResult,uint256 aiQualityScore,bool fraudFlagged,uint256 timestamp)",
  "function getVerificationCount(uint256 batchId) view returns (uint256)"
] as const;
