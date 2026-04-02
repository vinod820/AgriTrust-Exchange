import { ExplorerRow, formatWalletAddress, getExplorerActivity, getOnChainListings, getOnChainOrders } from "@/lib/contracts/client";
import { isBlockchainConfigured } from "@/lib/contracts/config";
import { getProductImageForCrop } from "@/lib/data/product-images";
import { getListings, getOrders, getTrace } from "@/lib/data/mock-db";
import type { Listing, Order, TraceEvent } from "@/lib/types";

function buildBatchLabel(crop: string, batchId: number) {
  const prefix =
    crop
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 3) || "LOT";

  return `BATCH-${prefix}-${batchId}`;
}

function buildOnChainListingId(batchId: number) {
  return `listing-onchain-${batchId}`;
}

function buildOnChainRoomId(batchId: number) {
  return `room-onchain-${batchId}`;
}

function getQualityGrade(score: number): Listing["qualityGrade"] {
  if (score >= 95) {
    return "A+";
  }

  if (score >= 80) {
    return "A";
  }

  if (score >= 60) {
    return "B";
  }

  return "C";
}

function mapEscrowStatus(status: number): Order["escrowStatus"] {
  if (status === 4) {
    return "disputed";
  }

  if (status === 5) {
    return "released";
  }

  if (status === 6) {
    return "refunded";
  }

  if (status === 1 || status === 2 || status === 3) {
    return "locked";
  }

  return "pending";
}

function deriveListingStatus(
  listingStatus: number,
  qualityScore: number,
  relatedOrders: Order[]
): Listing["status"] {
  const hasReleased = relatedOrders.some((order) => order.escrowStatus === "released");
  if (hasReleased) {
    return "completed";
  }

  const hasLocked = relatedOrders.some((order) => order.escrowStatus === "locked");
  if (hasLocked) {
    return "escrow_locked";
  }

  if (listingStatus === 2) {
    return "completed";
  }

  if (listingStatus === 3) {
    return "flagged";
  }

  return qualityScore > 0 ? "verified" : "listed";
}

function getNumericValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function makeTraceId(prefix: string, suffix: string | number) {
  return `trace-${prefix}-${String(suffix).replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function getRelatedOrderIds(batchId: number, orders: Awaited<ReturnType<typeof getOnChainOrders>>) {
  return new Set(orders.filter((order) => order.batchId === batchId).map((order) => order.orderId));
}

function mapExplorerRowToTrace(row: ExplorerRow, batchLabel: string): TraceEvent | null {
  const orderId = getNumericValue(row.args.orderId);
  const batchId = getNumericValue(row.args.batchId);
  const reason = String(row.args.reason ?? "").trim();
  const amount = getNumericValue(row.args.amount);
  const remainingQuantityKg = getNumericValue(row.args.remainingQuantityKg);
  const qualityScore = getNumericValue(row.args.qualityScore);

  switch (`${row.contract}:${row.event}`) {
    case "CropBatch:BatchCreated":
      return {
        id: makeTraceId("chain-batch-created", row.transactionHash),
        batchId: batchLabel,
        title: "Batch minted on-chain",
        detail: `Batch #${batchId} was created on Polygon Amoy.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "CropBatch:BatchReadyForSale":
      return {
        id: makeTraceId("chain-batch-ready", row.transactionHash),
        batchId: batchLabel,
        title: "Batch ready for sale",
        detail: `Batch #${batchId} was marked ready for marketplace listing.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "CropBatch:QualityUpdated":
      return {
        id: makeTraceId("chain-quality", row.transactionHash),
        batchId: batchLabel,
        title: "Quality updated on-chain",
        detail: `Quality score ${qualityScore} was attached to batch #${batchId}.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "Marketplace:BatchListed":
      return {
        id: makeTraceId("chain-listed", row.transactionHash),
        batchId: batchLabel,
        title: "Marketplace listing created",
        detail: `Batch #${batchId} was listed on Polygon Amoy.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "Marketplace:ListingQuantityUpdated":
      return {
        id: makeTraceId("chain-quantity", row.transactionHash),
        batchId: batchLabel,
        title: "Available quantity updated",
        detail: `${remainingQuantityKg} kg is now available for this batch on-chain.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:OrderCreated":
      return {
        id: makeTraceId("chain-order-created", row.transactionHash),
        batchId: batchLabel,
        title: "Escrow locked on-chain",
        detail: `Order #${orderId} locked the buyer payment on Polygon Amoy.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:OrderShipped":
      return {
        id: makeTraceId("chain-order-shipped", row.transactionHash),
        batchId: batchLabel,
        title: "Shipment marked on-chain",
        detail: `Farmer marked order #${orderId} as shipped.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:DeliveryConfirmed":
      return {
        id: makeTraceId("chain-order-delivered", row.transactionHash),
        batchId: batchLabel,
        title: "Delivery confirmed",
        detail: `Buyer confirmed delivery for order #${orderId}.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:PaymentReleased":
      return {
        id: makeTraceId("chain-order-released", row.transactionHash),
        batchId: batchLabel,
        title: "Escrow released",
        detail: `Payment of ${amount} was released to the farmer for order #${orderId}.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:DisputeRaised":
      return {
        id: makeTraceId("chain-order-disputed", row.transactionHash),
        batchId: batchLabel,
        title: "Escrow disputed",
        detail: reason ? `Order #${orderId} was disputed: ${reason}.` : `Order #${orderId} was disputed on-chain.`,
        status: "flagged",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "EscrowSettlement:BuyerRefunded":
      return {
        id: makeTraceId("chain-order-refunded", row.transactionHash),
        batchId: batchLabel,
        title: "Buyer refunded",
        detail: `Refund of ${amount} was sent back to the buyer for order #${orderId}.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "VerificationTrust:VerificationAdded":
      return {
        id: makeTraceId("chain-verification", row.transactionHash),
        batchId: batchLabel,
        title: "Video verification saved on-chain",
        detail: `Verification proof for batch #${batchId} was recorded on Polygon Amoy.`,
        status: "done",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    case "VerificationTrust:FraudFlagged":
      return {
        id: makeTraceId("chain-fraud", row.transactionHash),
        batchId: batchLabel,
        title: "Fraud flagged on-chain",
        detail: `A fraud flag was recorded for batch #${batchId}.`,
        status: "flagged",
        timestamp: row.timestamp,
        txHash: row.transactionHash
      };
    default:
      return null;
  }
}

export async function mergeListingsWithChain(localListings: Listing[]) {
  if (!isBlockchainConfigured()) {
    return localListings;
  }

  try {
    const [chainListings, chainOrders] = await Promise.all([getOnChainListings(), getOnChainOrders()]);
    const localByBatchId = new Map(localListings.filter((listing) => listing.onChainBatchId).map((listing) => [listing.onChainBatchId!, listing]));
    const merged = new Map(localListings.map((listing) => [listing.id, { ...listing }]));

    chainListings.forEach((chainListing) => {
      const existing = localByBatchId.get(chainListing.batchId);
      const relatedOrders = chainOrders
        .filter((order) => order.batchId === chainListing.batchId)
        .map((order) => ({
          id: `order-onchain-${order.orderId}`,
          listingId: existing?.id ?? `listing-onchain-${chainListing.batchId}`,
          batchId: existing?.batchId ?? buildBatchLabel(chainListing.cropType, chainListing.batchId),
          buyerName: `Buyer ${formatWalletAddress(order.buyer)}`,
          buyerWallet: order.buyer,
          quantityKg: order.quantityKg,
          totalAmount: order.amount,
          escrowStatus: mapEscrowStatus(order.status),
          createdAt: new Date(order.createdAt * 1000).toISOString(),
          onChainOrderId: order.orderId,
          onChainTxHash: order.latestTxHash || order.txHash
        } satisfies Order));

      const nextListing: Listing = existing
        ? {
            ...existing,
            id: existing.id || buildOnChainListingId(chainListing.batchId),
            crop: chainListing.cropType,
            farmerWallet: chainListing.farmer,
            farmerName: existing.farmerName || `Farmer ${formatWalletAddress(chainListing.farmer)}`,
            quantityKg: chainListing.availableQuantityKg,
            pricePerKg: chainListing.pricePerKg,
            status: deriveListingStatus(chainListing.listingStatus, chainListing.qualityScore, relatedOrders),
            qualityGrade: getQualityGrade(chainListing.qualityScore),
            verified: chainListing.qualityScore > 0 || existing.verified,
            onChainBatchId: chainListing.batchId,
            onChainTxHash: chainListing.txHash || existing.onChainTxHash,
            images: existing.images?.length ? existing.images : [getProductImageForCrop(chainListing.cropType)],
            liveRoomId: existing.liveRoomId || buildOnChainRoomId(chainListing.batchId)
          }
        : {
            id: buildOnChainListingId(chainListing.batchId),
            batchId: buildBatchLabel(chainListing.cropType, chainListing.batchId),
            crop: chainListing.cropType,
            farmerName: `Farmer ${formatWalletAddress(chainListing.farmer)}`,
            farmerWallet: chainListing.farmer,
            location: "On-chain listing",
            quantityKg: chainListing.availableQuantityKg,
            pricePerKg: chainListing.pricePerKg,
            harvestDate: new Date(chainListing.createdAt * 1000).toISOString().slice(0, 10),
            status: deriveListingStatus(chainListing.listingStatus, chainListing.qualityScore, relatedOrders),
            qualityGrade: getQualityGrade(chainListing.qualityScore),
            verified: chainListing.qualityScore > 0,
            images: [getProductImageForCrop(chainListing.cropType)],
            description: `Synced from Polygon Amoy for ${chainListing.cropType.toLowerCase()} trade.`,
            liveRoomId: buildOnChainRoomId(chainListing.batchId),
            trustScore: chainListing.qualityScore > 0 ? 88 : 72,
            onChainBatchId: chainListing.batchId,
            onChainTxHash: chainListing.txHash,
            geoLabel: "On-chain listing"
          };

      merged.set(nextListing.id, nextListing);
    });

    return [...merged.values()].sort((left, right) =>
      (right.onChainBatchId ?? 0) - (left.onChainBatchId ?? 0) || right.harvestDate.localeCompare(left.harvestDate)
    );
  } catch {
    return localListings;
  }
}

export async function mergeOrdersWithChain(localOrders: Order[], listings: Listing[]) {
  if (!isBlockchainConfigured()) {
    return localOrders;
  }

  try {
    const chainOrders = await getOnChainOrders();
    const localByOnChainOrderId = new Map(localOrders.filter((order) => order.onChainOrderId).map((order) => [order.onChainOrderId!, order]));
    const listingByBatchId = new Map(listings.filter((listing) => listing.onChainBatchId).map((listing) => [listing.onChainBatchId!, listing]));
    const merged = new Map(localOrders.map((order) => [order.id, { ...order }]));

    chainOrders.forEach((chainOrder) => {
      const existing = localByOnChainOrderId.get(chainOrder.orderId);
      const listing = listingByBatchId.get(chainOrder.batchId);

      const nextOrder: Order = existing
        ? {
            ...existing,
            buyerWallet: chainOrder.buyer,
            quantityKg: chainOrder.quantityKg,
            totalAmount: chainOrder.amount,
            escrowStatus: mapEscrowStatus(chainOrder.status),
            createdAt: new Date(chainOrder.createdAt * 1000).toISOString(),
            onChainOrderId: chainOrder.orderId,
            onChainTxHash: chainOrder.latestTxHash || chainOrder.txHash
          }
        : {
            id: `order-onchain-${chainOrder.orderId}`,
            listingId: listing?.id ?? `listing-onchain-${chainOrder.batchId}`,
            batchId: listing?.batchId ?? `BATCH-CHAIN-${chainOrder.batchId}`,
            buyerName: `Buyer ${formatWalletAddress(chainOrder.buyer)}`,
            buyerWallet: chainOrder.buyer,
            quantityKg: chainOrder.quantityKg,
            totalAmount: chainOrder.amount,
            escrowStatus: mapEscrowStatus(chainOrder.status),
            createdAt: new Date(chainOrder.createdAt * 1000).toISOString(),
            onChainOrderId: chainOrder.orderId,
            onChainTxHash: chainOrder.latestTxHash || chainOrder.txHash
          };

      merged.set(nextOrder.id, nextOrder);
    });

    return [...merged.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } catch {
    return localOrders;
  }
}

export async function getMergedListings() {
  return mergeListingsWithChain(getListings());
}

export async function getMergedListingById(listingId: string) {
  const listings = await getMergedListings();
  return listings.find((listing) => listing.id === listingId) ?? null;
}

export async function getMergedListingByBatchId(batchId: string) {
  const listings = await getMergedListings();
  return listings.find((listing) => listing.batchId === batchId) ?? null;
}

export async function getMergedListingByRoomId(roomId: string) {
  const listings = await getMergedListings();
  return listings.find((listing) => (listing.liveRoomId ?? `room-${listing.id}`) === roomId) ?? null;
}

export async function getMergedOrders() {
  const listings = await getMergedListings();
  return mergeOrdersWithChain(getOrders(), listings);
}

export async function getMergedOrderById(orderId: string) {
  const orders = await getMergedOrders();
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function getMergedTrace(batchId: string) {
  const localEvents = getTrace(batchId);
  if (!isBlockchainConfigured()) {
    return localEvents;
  }

  try {
    const listing = await getMergedListingByBatchId(batchId);
    if (!listing?.onChainBatchId) {
      return localEvents;
    }

    const [activity, chainOrders] = await Promise.all([getExplorerActivity(), getOnChainOrders()]);
    const relatedOrderIds = getRelatedOrderIds(listing.onChainBatchId, chainOrders);

    const explorerEvents = activity
      .filter((row) => {
        if (row.contract === "EscrowSettlement") {
          if (row.event === "OrderCreated") {
            return getNumericValue(row.args.batchId) === listing.onChainBatchId;
          }

          return relatedOrderIds.has(getNumericValue(row.args.orderId));
        }

        return getNumericValue(row.args.batchId) === listing.onChainBatchId;
      })
      .map((row) => mapExplorerRowToTrace(row, batchId))
      .filter((event): event is TraceEvent => Boolean(event));

    const merged = new Map<string, TraceEvent>();
    [...localEvents, ...explorerEvents].forEach((event) => {
      const key = event.txHash || `${event.title}-${event.timestamp}`;
      if (!merged.has(key)) {
        merged.set(key, event);
      }
    });

    return [...merged.values()].sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  } catch {
    return localEvents;
  }
}
