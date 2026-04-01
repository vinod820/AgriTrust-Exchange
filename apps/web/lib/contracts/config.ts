export const contracts = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337),
  supplyChainAddress:
    process.env.NEXT_PUBLIC_SUPPLY_CHAIN_ADDRESS ??
    "0x0000000000000000000000000000000000000000",
  escrowAddress:
    process.env.NEXT_PUBLIC_ESCROW_ADDRESS ??
    "0x0000000000000000000000000000000000000000",
  reputationAddress:
    process.env.NEXT_PUBLIC_REPUTATION_ADDRESS ??
    "0x0000000000000000000000000000000000000000"
};

export const supplyChainMethods = [
  "registerUser",
  "verifyUser",
  "produceItemByFarmer",
  "sellItemByFarmer",
  "purchaseItemByDistributor",
  "purchaseItemByRetailer",
  "purchaseItemByConsumer",
  "confirmDispatch",
  "confirmReceipt",
  "openDispute",
  "resolveDispute"
];

