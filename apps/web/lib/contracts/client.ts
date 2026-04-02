import { BrowserProvider, Contract, EventLog, JsonRpcProvider, VoidSigner, ethers } from "ethers";
import { getInjectedProvider } from "@/lib/wallet/provider";
import { cropBatchAbi, escrowSettlementAbi, marketplaceAbi, verificationTrustAbi } from "@/lib/contracts/abi";
import { contracts, isBlockchainConfigured } from "@/lib/contracts/config";

export type ExplorerRow = {
  contract: string;
  event: string;
  blockNumber: number;
  timestamp: string;
  transactionHash: string;
  args: Record<string, unknown>;
};

type LiveListing = {
  batchId: number;
  farmer: string;
  pricePerKg: number;
  availableQuantityKg: number;
  listingStatus: number;
  updatedAt: number;
  cropType: string;
  qualityScore: number;
  quantityKg: number;
  ipfsHash: string;
  createdAt: number;
  txHash: string;
};

export type OnChainOrderSnapshot = {
  orderId: number;
  batchId: number;
  buyer: string;
  farmer: string;
  quantityKg: number;
  amount: number;
  createdAt: number;
  deliveryDeadline: number;
  status: number;
  deliveryConfirmed: boolean;
  disputeRaised: boolean;
  disputeReason: string;
  txHash: string;
  latestTxHash: string;
};

export type ListingPublishFailureResolution = {
  message: string;
  shouldSaveLocally: boolean;
};

function isEventLog(value: unknown): value is EventLog {
  return value !== null && typeof value === "object" && "args" in value;
}

function getNumericArg(event: EventLog, key: string) {
  return Number((event.args as Record<string, bigint | undefined>)[key] ?? 0n);
}

function assertBlockchainConfigured() {
  if (!isBlockchainConfigured()) {
    throw new Error(
      "Blockchain contract addresses are missing. Set NEXT_PUBLIC_CROP_BATCH_ADDRESS, NEXT_PUBLIC_MARKETPLACE_ADDRESS, NEXT_PUBLIC_ESCROW_SETTLEMENT_ADDRESS, and NEXT_PUBLIC_VERIFICATION_TRUST_ADDRESS."
    );
  }
}

function getReadProvider() {
  return new JsonRpcProvider(contracts.amoyRpcUrl);
}

export function formatWalletAddress(address: string) {
  if (!address) {
    return "Unknown wallet";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getBrowserProvider() {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("MetaMask is required for blockchain actions.");
  }

  return new BrowserProvider(provider as never);
}

function getRpcChainIdHex(chainId: number) {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain id: ${chainId}`);
  }

  return `0x${chainId.toString(16)}`;
}

function getAmoyPriorityFeeFloor() {
  return ethers.parseUnits("25", "gwei");
}

function getBufferedGasLimit(estimatedGas: bigint) {
  return (estimatedGas * 120n) / 100n + 10000n;
}

function formatPolAmount(value: bigint) {
  const amount = Number(ethers.formatEther(value));
  if (amount >= 1) {
    return `${amount.toFixed(4)} POL`;
  }

  if (amount >= 0.01) {
    return `${amount.toFixed(5)} POL`;
  }

  return `${amount.toFixed(6)} POL`;
}

function getErrorCode(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "";
}

export function resolveListingPublishFailure(error: unknown): ListingPublishFailureResolution {
  const code = getErrorCode(error);
  const rawMessage = getErrorMessage(error);
  const message = rawMessage.toLowerCase();

  if (code === 4001 || message.includes("user rejected") || message.includes("user denied")) {
    return {
      message: "MetaMask confirmation was cancelled, so no Polygon Amoy listing was created.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("insufficient funds") || message.includes("insufficient polygon amoy balance")) {
    return {
      message: rawMessage || "The connected wallet does not have enough Polygon Amoy balance for gas.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("missing revert data") || message.includes("call_exception") || message.includes("estimateGas".toLowerCase())) {
    return {
      message: "Polygon Amoy could not prepare the listing transaction right now. Please try the same listing again.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("only farmer") || message.includes("wrong wallet") || message.includes("not the farmer")) {
    return {
      message: "This wallet is not allowed to publish that batch on Polygon Amoy.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("not ready for sale") || message.includes("batch not sale ready")) {
    return {
      message: "The batch is not ready for sale on Polygon Amoy yet. Please try again in a moment.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("metamask is required")) {
    return {
      message: "MetaMask was not detected for this blockchain action.",
      shouldSaveLocally: false
    };
  }

  if (message.includes("chain") || message.includes("polygon amoy")) {
    return {
      message: "MetaMask could not connect to Polygon Amoy for this listing.",
      shouldSaveLocally: false
    };
  }

  return {
    message: "The Polygon Amoy listing could not be created right now.",
    shouldSaveLocally: false
  };
}

async function waitForBatchStatus(cropBatch: Contract, batchId: number, expectedStatus: number, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const batch = await cropBatch.getBatch(BigInt(batchId));
    if (Number(batch.status) === expectedStatus) {
      return batch;
    }

    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  throw new Error("The batch update was mined, but Polygon Amoy did not reflect the expected status in time.");
}

async function getMarketplaceListingReadiness(input: {
  cropBatch: Contract;
  marketplace: Contract;
  batchId: number;
  signerAddress: string;
  quantityKg: bigint;
  pricePerKg: bigint;
}) {
  const [batch, listing] = await Promise.all([
    input.cropBatch.getBatch(BigInt(input.batchId)),
    input.marketplace.getListing(BigInt(input.batchId))
  ]);

  if (batch.batchId === 0n) {
    throw new Error("The on-chain batch record could not be found on Polygon Amoy.");
  }

  if (batch.farmer.toLowerCase() !== input.signerAddress.toLowerCase()) {
    throw new Error("This wallet is not the farmer that created the on-chain batch.");
  }

  if (Number(batch.status) !== 2) {
    throw new Error("The batch is not marked ready for sale on-chain yet.");
  }

  if (input.pricePerKg <= 0n) {
    throw new Error("The marketplace price must be greater than zero.");
  }

  if (input.quantityKg <= 0n || input.quantityKg > batch.quantityKg) {
    throw new Error("The listing quantity is invalid for this on-chain batch.");
  }

  return { batch, listing };
}

function getEstimatorContracts(signerAddress: string) {
  const provider = getReadProvider();
  const signer = new VoidSigner(signerAddress, provider);

  return {
    provider,
    cropBatch: new Contract(contracts.cropBatchAddress, cropBatchAbi, signer),
    marketplace: new Contract(contracts.marketplaceAddress, marketplaceAbi, signer)
  };
}

async function assertSufficientBalanceForStep(
  provider: JsonRpcProvider,
  signerAddress: string,
  requiredMaxCost: bigint,
  stepLabel: string
) {
  const balance = await provider.getBalance(signerAddress);

  if (balance < requiredMaxCost) {
    throw new Error(
      `Insufficient Polygon Amoy balance. Wallet ${formatWalletAddress(signerAddress)} has ${formatPolAmount(balance)}, but ${stepLabel} needs about ${formatPolAmount(requiredMaxCost)} for gas.`
    );
  }
}

async function getWriteFeeOverrides(provider: BrowserProvider) {
  const feeData = await provider.getFeeData();
  const priorityFeeFloor = contracts.chainId === 80002 ? getAmoyPriorityFeeFloor() : 0n;
  const maxPriorityFeePerGas =
    feeData.maxPriorityFeePerGas && feeData.maxPriorityFeePerGas > priorityFeeFloor
      ? feeData.maxPriorityFeePerGas
      : priorityFeeFloor;

  const impliedBaseFee =
    feeData.maxFeePerGas && feeData.maxPriorityFeePerGas
      ? feeData.maxFeePerGas - feeData.maxPriorityFeePerGas
      : feeData.gasPrice ?? 0n;

  const safeBaseFee = impliedBaseFee > 0n ? impliedBaseFee : ethers.parseUnits("5", "gwei");
  const maxFeePerGas = safeBaseFee * 2n + maxPriorityFeePerGas;

  return {
    maxPriorityFeePerGas,
    maxFeePerGas
  };
}

export async function ensureWalletOnAmoy() {
  const provider = getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  const rpcChainId = getRpcChainIdHex(contracts.chainId);

  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: rpcChainId }]);
  } catch (error) {
    const chainError = error as { code?: number };
    if (chainError.code === 4902) {
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: rpcChainId,
          chainName: "Polygon Amoy",
          nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
          rpcUrls: [contracts.amoyRpcUrl],
          blockExplorerUrls: [contracts.amoyExplorerUrl]
        }
      ]);
    } else {
      throw error;
    }
  }

  return provider;
}

export async function getWalletAddress() {
  const provider = await ensureWalletOnAmoy();
  const signer = await provider.getSigner();
  return signer.getAddress();
}

export async function getVerificationTrustAdminAddress() {
  const { verificationTrust } = getReadContracts();
  return (await verificationTrust.admin()) as string;
}

export function getReadContracts() {
  assertBlockchainConfigured();

  const provider = getReadProvider();
  return {
    cropBatch: new Contract(contracts.cropBatchAddress, cropBatchAbi, provider),
    marketplace: new Contract(contracts.marketplaceAddress, marketplaceAbi, provider),
    escrowSettlement: new Contract(contracts.escrowSettlementAddress, escrowSettlementAbi, provider),
    verificationTrust: new Contract(contracts.verificationTrustAddress, verificationTrustAbi, provider)
  };
}

export async function getWriteContracts() {
  assertBlockchainConfigured();

  const provider = await ensureWalletOnAmoy();
  const signer = await provider.getSigner();
  const feeOverrides = await getWriteFeeOverrides(provider);

  return {
    signer,
    feeOverrides,
    cropBatch: new Contract(contracts.cropBatchAddress, cropBatchAbi, signer),
    marketplace: new Contract(contracts.marketplaceAddress, marketplaceAbi, signer),
    escrowSettlement: new Contract(contracts.escrowSettlementAddress, escrowSettlementAbi, signer),
    verificationTrust: new Contract(contracts.verificationTrustAddress, verificationTrustAbi, signer)
  };
}

function serializeArg(value: unknown): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeArg);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, serializeArg(inner)]));
  }

  return value;
}

async function collectEventRows(
  contractName: string,
  contract: Contract,
  eventNames: string[],
  fromBlock: number,
  toBlock: number,
  provider: JsonRpcProvider,
  blockTimestampCache: Map<number, string>
) {
  const rows: ExplorerRow[] = [];

  for (const eventName of eventNames) {
    const filter = (contract.filters as Record<string, () => unknown>)[eventName]?.();
    if (!filter) {
      continue;
    }

    const events = await contract.queryFilter(filter as never, fromBlock, toBlock);
    const eventLogs = events.filter(isEventLog);
    const missingBlocks = [...new Set(eventLogs.map((event) => event.blockNumber))].filter(
      (blockNumber) => !blockTimestampCache.has(blockNumber)
    );

    if (missingBlocks.length > 0) {
      const blocks = await Promise.all(missingBlocks.map((blockNumber) => provider.getBlock(blockNumber)));
      blocks.forEach((block, index) => {
        const blockNumber = missingBlocks[index];
        blockTimestampCache.set(
          blockNumber,
          new Date(Number(block?.timestamp ?? Math.floor(Date.now() / 1000)) * 1000).toISOString()
        );
      });
    }

    eventLogs.forEach((event) => {
      if (!isEventLog(event)) {
        return;
      }

      const argsObject =
        typeof (event.args as { toObject?: () => Record<string, unknown> } | undefined)?.toObject === "function"
          ? (event.args as { toObject: () => Record<string, unknown> }).toObject()
          : ((event.args ?? {}) as Record<string, unknown>);

      rows.push({
        contract: contractName,
        event: eventName,
        blockNumber: event.blockNumber,
        timestamp: blockTimestampCache.get(event.blockNumber) ?? new Date().toISOString(),
        transactionHash: event.transactionHash,
        args: serializeArg(argsObject) as Record<string, unknown>
      });
    });
  }

  return rows;
}

export async function getExplorerActivity() {
  assertBlockchainConfigured();

  const provider = getReadProvider();
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - contracts.lookbackBlocks);
  const { cropBatch, marketplace, escrowSettlement, verificationTrust } = getReadContracts();
  const blockTimestampCache = new Map<number, string>();

  const rows = await Promise.all([
    collectEventRows(
      "CropBatch",
      cropBatch,
      ["BatchCreated", "BatchReadyForSale", "QualityUpdated"],
      fromBlock,
      latestBlock,
      provider,
      blockTimestampCache
    ),
    collectEventRows(
      "Marketplace",
      marketplace,
      ["BatchListed", "ListingPriceUpdated", "ListingQuantityUpdated", "AuthorizedManagerSet"],
      fromBlock,
      latestBlock,
      provider,
      blockTimestampCache
    ),
    collectEventRows(
      "EscrowSettlement",
      escrowSettlement,
      ["OrderCreated", "OrderShipped", "DeliveryConfirmed", "PaymentReleased", "DisputeRaised", "BuyerRefunded"],
      fromBlock,
      latestBlock,
      provider,
      blockTimestampCache
    ),
    collectEventRows(
      "VerificationTrust",
      verificationTrust,
      ["VerificationAdded", "TrustScoreUpdated", "FraudFlagged"],
      fromBlock,
      latestBlock,
      provider,
      blockTimestampCache
    )
  ]);

  return rows.flat().sort((left, right) => right.blockNumber - left.blockNumber);
}

export async function getOnChainListings(): Promise<LiveListing[]> {
  assertBlockchainConfigured();

  const provider = getReadProvider();
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - contracts.lookbackBlocks);
  const { cropBatch, marketplace } = getReadContracts();

  const events = await marketplace.queryFilter(marketplace.filters.BatchListed(), fromBlock, latestBlock);
  const latestListingEvents = new Map<number, { txHash: string; blockNumber: number }>();

  events.filter(isEventLog).forEach((event) => {
    const batchId = getNumericArg(event, "batchId");
    const previous = latestListingEvents.get(batchId);
    if (!previous || event.blockNumber >= previous.blockNumber) {
      latestListingEvents.set(batchId, {
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    }
  });

  const listingIds = [...latestListingEvents.keys()];

  const listings = await Promise.all(
    listingIds.map(async (batchId) => {
      const [listing, batch] = await Promise.all([marketplace.getListing(batchId), cropBatch.getBatch(batchId)]);
      return {
        batchId,
        farmer: listing.farmer,
        pricePerKg: Number(listing.pricePerKg),
        availableQuantityKg: Number(listing.availableQuantityKg),
        listingStatus: Number(listing.status),
        updatedAt: Number(listing.updatedAt),
        cropType: batch.cropType,
        qualityScore: Number(batch.qualityScore),
        quantityKg: Number(batch.quantityKg),
        ipfsHash: batch.ipfsHash,
        createdAt: Number(batch.createdAt),
        txHash: latestListingEvents.get(batchId)?.txHash ?? ""
      };
    })
  );

  return listings.sort((left, right) => right.createdAt - left.createdAt);
}

export async function getLiveListings(): Promise<LiveListing[]> {
  return (await getOnChainListings()).filter((item) => item.listingStatus === 1 && item.availableQuantityKg > 0);
}

export async function getOnChainOrders(): Promise<OnChainOrderSnapshot[]> {
  assertBlockchainConfigured();

  const provider = getReadProvider();
  const latestBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, latestBlock - contracts.lookbackBlocks);
  const { escrowSettlement } = getReadContracts();

  const nextOrderId = Number(await escrowSettlement.nextOrderId());
  if (nextOrderId <= 1) {
    return [];
  }

  const [createdEvents, shippedEvents, deliveredEvents, disputedEvents, releasedEvents, refundedEvents] = await Promise.all([
    escrowSettlement.queryFilter(escrowSettlement.filters.OrderCreated(), fromBlock, latestBlock),
    escrowSettlement.queryFilter(escrowSettlement.filters.OrderShipped(), fromBlock, latestBlock),
    escrowSettlement.queryFilter(escrowSettlement.filters.DeliveryConfirmed(), fromBlock, latestBlock),
    escrowSettlement.queryFilter(escrowSettlement.filters.DisputeRaised(), fromBlock, latestBlock),
    escrowSettlement.queryFilter(escrowSettlement.filters.PaymentReleased(), fromBlock, latestBlock),
    escrowSettlement.queryFilter(escrowSettlement.filters.BuyerRefunded(), fromBlock, latestBlock)
  ]);

  const createdMap = new Map<number, string>();
  const latestStatusTxMap = new Map<number, string>();

  createdEvents.filter(isEventLog).forEach((event) => {
    createdMap.set(getNumericArg(event, "orderId"), event.transactionHash);
  });

  [shippedEvents, deliveredEvents, disputedEvents, releasedEvents, refundedEvents].forEach((group) => {
    group.filter(isEventLog).forEach((event) => {
      latestStatusTxMap.set(getNumericArg(event, "orderId"), event.transactionHash);
    });
  });

  const orderIds = Array.from({ length: nextOrderId - 1 }, (_, index) => index + 1);
  const orders = await Promise.all(
    orderIds.map(async (orderId) => {
      const order = await escrowSettlement.orders(orderId);
      return {
        orderId: Number(order.orderId),
        batchId: Number(order.batchId),
        buyer: order.buyer,
        farmer: order.farmer,
        quantityKg: Number(order.quantityKg),
        amount: Number(order.amount),
        createdAt: Number(order.createdAt),
        deliveryDeadline: Number(order.deliveryDeadline),
        status: Number(order.status),
        deliveryConfirmed: Boolean(order.deliveryConfirmed),
        disputeRaised: Boolean(order.disputeRaised),
        disputeReason: order.disputeReason,
        txHash: createdMap.get(orderId) ?? "",
        latestTxHash: latestStatusTxMap.get(orderId) ?? createdMap.get(orderId) ?? ""
      } satisfies OnChainOrderSnapshot;
    })
  );

  return orders
    .filter((order) => order.orderId > 0)
    .sort((left, right) => right.createdAt - left.createdAt);
}

export async function publishBatchOnChain(input: {
  cropType: string;
  quantityKg: number;
  imageReference: string;
  geoLabel: string;
  pricePerKg: number;
  onProgress?: (message: string) => void;
}) {
  const { cropBatch, marketplace, signer, feeOverrides } = await getWriteContracts();
  const signerAddress = await signer.getAddress();
  const { provider: estimateProvider, cropBatch: cropBatchEstimator, marketplace: marketplaceEstimator } =
    getEstimatorContracts(signerAddress);
  const quantityKg = BigInt(Math.max(1, Math.round(input.quantityKg)));
  const pricePerKg = BigInt(Math.max(1, Math.round(input.pricePerKg)));
  const geoHash = ethers.id(input.geoLabel || "Unknown origin");
  const reportProgress = input.onProgress ?? (() => {});
  const maxFeePerGas = feeOverrides.maxFeePerGas;

  reportProgress("Step 1 of 3: confirm batch creation in MetaMask.");
  const createGas = await cropBatchEstimator.createBatch.estimateGas(input.cropType, quantityKg, input.imageReference, geoHash);
  const createGasLimit = getBufferedGasLimit(createGas);
  await assertSufficientBalanceForStep(
    estimateProvider,
    signerAddress,
    createGasLimit * maxFeePerGas,
    "batch creation"
  );
  const createTx = await cropBatch.createBatch(input.cropType, quantityKg, input.imageReference, geoHash, {
    ...feeOverrides,
    gasLimit: createGasLimit
  });
  reportProgress("Step 1 submitted. Waiting for Polygon Amoy confirmation...");
  const createReceipt = await createTx.wait();
  const createEvent = createReceipt?.logs
    .map((log: unknown) => {
      try {
        return cropBatch.interface.parseLog(log as never);
      } catch {
        return null;
      }
    })
    .find((event: { name?: string } | null) => event?.name === "BatchCreated");

  const batchId = Number((createEvent?.args as { batchId?: bigint } | undefined)?.batchId ?? 0n);
  if (!batchId) {
    throw new Error("The batch was created, but its on-chain id could not be read from the transaction receipt.");
  }

  reportProgress("Step 2 of 3: confirm 'mark ready for sale' in MetaMask.");
  const readyGas = await cropBatchEstimator.markReadyForSale.estimateGas(BigInt(batchId));
  const readyGasLimit = getBufferedGasLimit(readyGas);
  await assertSufficientBalanceForStep(
    estimateProvider,
    signerAddress,
    readyGasLimit * maxFeePerGas,
    "marking the batch ready for sale"
  );
  const readyTx = await cropBatch.markReadyForSale(BigInt(batchId), {
    ...feeOverrides,
    gasLimit: readyGasLimit
  });
  reportProgress("Step 2 submitted. Waiting for Polygon Amoy confirmation...");
  await readyTx.wait();
  reportProgress("Checking batch status on Polygon Amoy before marketplace listing...");
  await waitForBatchStatus(cropBatch, batchId, 2);
  await getMarketplaceListingReadiness({
    cropBatch,
    marketplace,
    batchId,
    pricePerKg,
    quantityKg,
    signerAddress
  });

  reportProgress("Step 3 of 3: confirm marketplace listing in MetaMask.");
  const listGas = await marketplaceEstimator.listBatch.estimateGas(BigInt(batchId), pricePerKg, quantityKg);
  const listGasLimit = getBufferedGasLimit(listGas);
  await assertSufficientBalanceForStep(
    estimateProvider,
    signerAddress,
    listGasLimit * maxFeePerGas,
    "publishing the marketplace listing"
  );
  const listTx = await marketplace.listBatch(BigInt(batchId), pricePerKg, quantityKg, {
    ...feeOverrides,
    gasLimit: listGasLimit
  });
  reportProgress("Step 3 submitted. Waiting for final marketplace confirmation...");
  await listTx.wait();
  reportProgress("Listing is now live on Polygon Amoy.");

  return {
    batchId,
    transactionHash: listTx.hash,
    farmerAddress: signerAddress
  };
}

export async function createEscrowOrder(input: {
  batchId: number;
  quantityKg: number;
  pricePerKg: number;
  deliveryWindowSeconds: number;
}) {
  const { escrowSettlement, feeOverrides } = await getWriteContracts();
  const roundedQuantity = BigInt(Math.max(1, Math.round(input.quantityKg)));
  const roundedPrice = BigInt(Math.max(1, Math.round(input.pricePerKg)));
  const amount = roundedQuantity * roundedPrice;

  const tx = await escrowSettlement.createOrder(
    BigInt(input.batchId),
    roundedQuantity,
    BigInt(Math.max(1, Math.round(input.deliveryWindowSeconds))),
    {
      ...feeOverrides,
      value: amount
    }
  );
  const receipt = await tx.wait();

  const orderEvent = receipt?.logs
    .map((log: unknown) => {
      try {
        return escrowSettlement.interface.parseLog(log as never);
      } catch {
        return null;
      }
    })
    .find((event: { name?: string } | null) => event?.name === "OrderCreated");

  return {
    orderId: Number((orderEvent?.args as { orderId?: bigint } | undefined)?.orderId ?? 0n),
    transactionHash: tx.hash
  };
}

export async function markEscrowShipped(orderId: number) {
  const { escrowSettlement, feeOverrides } = await getWriteContracts();
  const tx = await escrowSettlement.markShipped(BigInt(orderId), feeOverrides);
  await tx.wait();

  return {
    transactionHash: tx.hash
  };
}

export async function confirmEscrowDelivery(orderId: number) {
  const { escrowSettlement, feeOverrides } = await getWriteContracts();
  const tx = await escrowSettlement.confirmDelivery(BigInt(orderId), feeOverrides);
  await tx.wait();

  return {
    transactionHash: tx.hash
  };
}

export async function raiseEscrowDispute(orderId: number, reason: string) {
  const { escrowSettlement, feeOverrides } = await getWriteContracts();
  const tx = await escrowSettlement.raiseDispute(BigInt(orderId), reason, feeOverrides);
  await tx.wait();

  return {
    transactionHash: tx.hash
  };
}

export async function releaseEscrowPayment(orderId: number) {
  const { escrowSettlement, feeOverrides } = await getWriteContracts();
  const tx = await escrowSettlement.releasePayment(BigInt(orderId), feeOverrides);
  await tx.wait();

  return {
    transactionHash: tx.hash
  };
}

export async function addVerificationWithWallet(input: {
  batchId: number;
  videoHash: string;
  expertResult: string;
  aiQualityScore: number;
}) {
  const { signer, verificationTrust, feeOverrides } = await getWriteContracts();
  const signerAddress = await signer.getAddress();
  const provider = getReadProvider();
  const estimator = new Contract(contracts.verificationTrustAddress, verificationTrustAbi, new VoidSigner(signerAddress, provider));
  const qualityScore = BigInt(Math.max(0, Math.min(100, Math.round(input.aiQualityScore))));
  const estimatedGas = await estimator.addVerification.estimateGas(
    BigInt(input.batchId),
    input.videoHash,
    input.expertResult,
    qualityScore
  );
  const gasLimit = getBufferedGasLimit(estimatedGas);
  await assertSufficientBalanceForStep(
    provider,
    signerAddress,
    gasLimit * feeOverrides.maxFeePerGas,
    "saving the video verification"
  );
  const tx = await verificationTrust.addVerification(
    BigInt(input.batchId),
    input.videoHash,
    input.expertResult,
    qualityScore,
    {
      ...feeOverrides,
      gasLimit
    }
  );
  await tx.wait();

  return {
    transactionHash: tx.hash,
    signerAddress
  };
}
