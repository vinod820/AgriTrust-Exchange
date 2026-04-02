const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_AMOY_RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/Re8HLupnp7upvaqbV5FwK";
const DEFAULT_DEPLOYED_CONTRACTS = {
  cropBatch: "0xedc8d4b8D4D6fAe0371Ca689b538Fb8E7A9b19E4",
  marketplace: "0xfe121534BbC46d440f03728BD2D6eaCd81148033",
  escrowSettlement: "0xAdEfC09fCEF8542435BC1A67C2BF1c3c6F02Caf1",
  verificationTrust: "0x792D430CfB58A54a6c9c20b1b4fcc1e3373d11cF"
} as const;

function normalizeAddress(value: string | undefined) {
  return value?.trim() || ZERO_ADDRESS;
}

function isConfiguredAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value) && value !== ZERO_ADDRESS;
}

export const contracts = {
  chainId: Number(process.env.NEXT_PUBLIC_AMOY_CHAIN_ID ?? process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002),
  amoyRpcUrl: process.env.NEXT_PUBLIC_AMOY_RPC_URL ?? process.env.AMOY_RPC_URL ?? DEFAULT_AMOY_RPC_URL,
  amoyExplorerUrl: process.env.NEXT_PUBLIC_AMOY_EXPLORER_URL ?? "https://amoy.polygonscan.com",
  cropBatchAddress: normalizeAddress(process.env.NEXT_PUBLIC_CROP_BATCH_ADDRESS ?? DEFAULT_DEPLOYED_CONTRACTS.cropBatch),
  marketplaceAddress: normalizeAddress(
    process.env.NEXT_PUBLIC_MARKETPLACE_ADDRESS ?? DEFAULT_DEPLOYED_CONTRACTS.marketplace
  ),
  escrowSettlementAddress: normalizeAddress(
    process.env.NEXT_PUBLIC_ESCROW_SETTLEMENT_ADDRESS ?? DEFAULT_DEPLOYED_CONTRACTS.escrowSettlement
  ),
  verificationTrustAddress: normalizeAddress(
    process.env.NEXT_PUBLIC_VERIFICATION_TRUST_ADDRESS ?? DEFAULT_DEPLOYED_CONTRACTS.verificationTrust
  ),
  lookbackBlocks: Number(process.env.NEXT_PUBLIC_AMOY_LOOKBACK_BLOCKS ?? 50000)
};

export const contractAddressState = {
  cropBatch: isConfiguredAddress(contracts.cropBatchAddress),
  marketplace: isConfiguredAddress(contracts.marketplaceAddress),
  escrowSettlement: isConfiguredAddress(contracts.escrowSettlementAddress),
  verificationTrust: isConfiguredAddress(contracts.verificationTrustAddress)
};

export function isBlockchainConfigured() {
  return Object.values(contractAddressState).every(Boolean);
}
