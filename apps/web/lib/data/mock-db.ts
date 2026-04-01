import {
  AnalysisResult,
  CreateListingInput,
  FraudFlag,
  Listing,
  Order,
  TraceEvent,
  VideoRoom
} from "@/lib/types";
import { evaluateFraud } from "@/lib/fraud/rules";
import { getProductImageForCrop } from "@/lib/data/product-images";

const now = new Date();

function isoMinutesAgo(minutes: number) {
  return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

let listings: Listing[] = [
  {
    id: "listing-tomato-001",
    batchId: "BATCH-TOM-2401",
    crop: "Tomato",
    farmerName: "Meera Farms",
    farmerWallet: "0x8b4A...1C3f",
    location: "Nashik, Maharashtra",
    quantityKg: 900,
    pricePerKg: 28,
    harvestDate: "2026-03-29",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: ["/images/products/tomato.svg"],
    description: "Hybrid tomatoes packed the same day with cold-chain pickup ready.",
    liveRoomId: "room-tomato-001",
    trustScore: 91,
    aiAnalysis: {
      crop: "Tomato",
      disease: "Healthy",
      qualityGrade: "A",
      confidence: 0.94,
      freshness: 0.9,
      suggestedPricePerKg: 30,
      recommendations: [
        "Keep ventilated during transport.",
        "Dispatch within 24 hours for best shelf life."
      ]
    }
  },
  {
    id: "listing-rice-002",
    batchId: "BATCH-RICE-8812",
    crop: "Rice",
    farmerName: "Green Delta Collective",
    farmerWallet: "0x4c7E...8899",
    location: "Thanjavur, Tamil Nadu",
    quantityKg: 2200,
    pricePerKg: 44,
    harvestDate: "2026-03-20",
    status: "escrow_locked",
    qualityGrade: "A+",
    verified: true,
    images: ["/images/products/rice.svg"],
    description: "Premium ponni rice with moisture test report and verified origin.",
    liveRoomId: "room-rice-002",
    trustScore: 96,
    aiAnalysis: {
      crop: "Rice",
      disease: "Healthy",
      qualityGrade: "A+",
      confidence: 0.97,
      freshness: 0.86,
      suggestedPricePerKg: 46,
      recommendations: [
        "Store below 14 percent moisture.",
        "Seal lot after final bagging."
      ]
    }
  },
  {
    id: "listing-chilli-003",
    batchId: "BATCH-CH-7703",
    crop: "Green Chilli",
    farmerName: "Raj Agro",
    farmerWallet: "0x91a2...7740",
    location: "Guntur, Andhra Pradesh",
    quantityKg: 420,
    pricePerKg: 60,
    harvestDate: "2026-03-30",
    status: "flagged",
    qualityGrade: "B",
    verified: false,
    images: ["/images/products/green-chilli.svg"],
    description: "Fresh green chilli lot awaiting re-verification after image duplication warning.",
    liveRoomId: "room-chilli-003",
    trustScore: 62
  }
];

let orders: Order[] = [
  {
    id: "order-001",
    listingId: "listing-rice-002",
    batchId: "BATCH-RICE-8812",
    buyerName: "Metro Fresh Foods",
    buyerWallet: "0x0aaB...2390",
    quantityKg: 800,
    totalAmount: 35200,
    escrowStatus: "locked",
    createdAt: isoMinutesAgo(160)
  }
];

let traceEvents: TraceEvent[] = [
  {
    id: "trace-1",
    batchId: "BATCH-TOM-2401",
    title: "Batch minted on-chain",
    detail: "Farmer created the lot with harvest date, origin, and metadata hash.",
    status: "done",
    timestamp: isoMinutesAgo(720),
    txHash: "0xabc123farmtomato"
  },
  {
    id: "trace-2",
    batchId: "BATCH-TOM-2401",
    title: "AI quality report attached",
    detail: "Disease screen and freshness score stored against the listing.",
    status: "done",
    timestamp: isoMinutesAgo(650)
  },
  {
    id: "trace-3",
    batchId: "BATCH-TOM-2401",
    title: "Buyer live verification room created",
    detail: "Room shared for one-to-one crop inspection over video.",
    status: "live",
    timestamp: isoMinutesAgo(45)
  },
  {
    id: "trace-4",
    batchId: "BATCH-RICE-8812",
    title: "Escrow locked",
    detail: "Buyer payment locked pending dispatch confirmation.",
    status: "done",
    timestamp: isoMinutesAgo(150),
    txHash: "0xescrowlockrice"
  }
];

let videoRooms: VideoRoom[] = [
  {
    id: "room-tomato-001",
    listingId: "listing-tomato-001",
    farmerName: "Meera Farms",
    buyerName: "Fresh Basket Retail",
    createdAt: isoMinutesAgo(50)
  },
  {
    id: "room-rice-002",
    listingId: "listing-rice-002",
    farmerName: "Green Delta Collective",
    buyerName: "Metro Fresh Foods",
    createdAt: isoMinutesAgo(180)
  }
];

let fraudFlags: FraudFlag[] = listings.flatMap((listing) => evaluateFraud(listing));

export function getListings() {
  return [...listings];
}

export function getFeaturedListings() {
  return listings.slice(0, 3);
}

export function getListingById(listingId: string) {
  return listings.find((listing) => listing.id === listingId);
}

export function createListing(input: CreateListingInput) {
  const listing: Listing = {
    id: id("listing"),
    batchId: `BATCH-${input.crop.toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    crop: input.crop,
    farmerName: input.farmerName,
    farmerWallet: input.farmerWallet,
    location: input.location,
    quantityKg: input.quantityKg,
    pricePerKg: input.pricePerKg,
    harvestDate: input.harvestDate,
    status: "under_review",
    qualityGrade: "B",
    verified: false,
    images: input.images && input.images.length > 0 ? input.images : [getProductImageForCrop(input.crop)],
    description: input.description,
    liveRoomId: id("room"),
    trustScore: 68
  };

  listings = [listing, ...listings];
  traceEvents = [
    {
      id: id("trace"),
      batchId: listing.batchId,
      title: "Listing created",
      detail: `${listing.crop} batch submitted by ${listing.farmerName}.`,
      status: "done",
      timestamp: new Date().toISOString()
    },
    ...traceEvents
  ];

  const newFlags = evaluateFraud(listing);
  fraudFlags = [...newFlags, ...fraudFlags];
  if (newFlags.length > 0) {
    listing.status = "flagged";
  }

  videoRooms = [
    {
      id: listing.liveRoomId ?? id("room"),
      listingId: listing.id,
      farmerName: listing.farmerName,
      createdAt: new Date().toISOString()
    },
    ...videoRooms
  ];

  return listing;
}

export function updateListingAnalysis(listingId: string, analysis: AnalysisResult) {
  const listing = getListingById(listingId);
  if (!listing) {
    return undefined;
  }

  listing.aiAnalysis = analysis;
  listing.qualityGrade = analysis.qualityGrade;
  listing.status = listing.status === "flagged" ? "flagged" : "verified";
  listing.verified = true;
  listing.trustScore = Math.min(99, Math.round(72 + analysis.confidence * 20));

  traceEvents = [
    {
      id: id("trace"),
      batchId: listing.batchId,
      title: "AI analysis completed",
      detail: `${analysis.disease} with ${(analysis.confidence * 100).toFixed(1)} percent confidence.`,
      status: "done",
      timestamp: new Date().toISOString()
    },
    ...traceEvents
  ];

  return listing;
}

export function createOrder(input: Omit<Order, "id" | "createdAt">) {
  const order: Order = {
    ...input,
    id: id("order"),
    createdAt: new Date().toISOString()
  };
  orders = [order, ...orders];

  const listing = getListingById(input.listingId);
  if (listing) {
    listing.status = "escrow_locked";
    traceEvents = [
      {
        id: id("trace"),
        batchId: listing.batchId,
        title: "Escrow locked",
        detail: `${order.buyerName} locked payment for ${order.quantityKg} kg.`,
        status: "done",
        timestamp: order.createdAt,
        txHash: "0xescrow-demo-locked"
      },
      ...traceEvents
    ];
  }

  return order;
}

export function getOrders() {
  return [...orders];
}

export function getTrace(batchId: string) {
  return traceEvents
    .filter((event) => event.batchId === batchId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function getFraudFlags() {
  return [...fraudFlags];
}

export function ensureVideoRoom(listingId: string, buyerName?: string) {
  const listing = getListingById(listingId);
  if (!listing) {
    return undefined;
  }

  const existing = videoRooms.find((room) => room.listingId === listingId);
  if (existing) {
    if (buyerName) {
      existing.buyerName = buyerName;
    }
    return existing;
  }

  const room: VideoRoom = {
    id: listing.liveRoomId ?? id("room"),
    listingId,
    farmerName: listing.farmerName,
    buyerName,
    createdAt: new Date().toISOString()
  };

  videoRooms = [room, ...videoRooms];
  return room;
}

export function getDashboardMetrics() {
  const verifiedCount = listings.filter((listing) => listing.verified).length;
  const flaggedCount = listings.filter((listing) => listing.status === "flagged").length;
  const escrowValue = orders
    .filter((order) => order.escrowStatus === "locked")
    .reduce((total, order) => total + order.totalAmount, 0);

  return {
    totalListings: listings.length,
    verifiedCount,
    flaggedCount,
    liveRooms: videoRooms.length,
    escrowValue
  };
}
