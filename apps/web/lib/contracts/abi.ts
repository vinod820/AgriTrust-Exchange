export const supplyChainAbi = [
  "function registerUser(uint8 role)",
  "function verifyUser(address user, bool verified)",
  "function produceItemByFarmer(string batchId, string metadataURI, uint256 price, uint256 shippingDeadline, uint256 harvestDate, string qualityGrade) returns (uint256)",
  "function sellItemByFarmer(uint256 productId, uint256 price)",
  "function purchaseItemByDistributor(uint256 productId) payable",
  "function purchaseItemByRetailer(uint256 productId) payable",
  "function purchaseItemByConsumer(uint256 productId) payable",
  "function openDispute(uint256 productId, string reason)",
  "function resolveDispute(uint256 productId, bool releaseToSeller)"
] as const;

export const escrowAbi = [
  "function createEscrow(uint256 productId, address buyer, address seller) payable returns (uint256)",
  "function release(uint256 escrowId)",
  "function refund(uint256 escrowId)",
  "function openDispute(uint256 escrowId, string reason)"
] as const;

export const reputationAbi = [
  "function registerUser(address user)",
  "function addReview(address user, uint8 rating)",
  "function getReputationScore(address user) view returns (uint256)"
] as const;

