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

function buildOnChainListingId(batchId: number) {
  return `listing-onchain-${batchId}`;
}

function buildOnChainRoomId(batchId: number) {
  return `room-onchain-${batchId}`;
}

// Real crop images from Unsplash/Pexels
const CROP_IMAGES = {
  tomato: [
    "https://images.unsplash.com/photo-1761070852353-c33a65a2aaec?w=800",
    "https://images.unsplash.com/photo-1631292172709-00b093a058b2?w=800",
    "https://images.unsplash.com/photo-1631292171396-26a654f51c48?w=800"
  ],
  rice: [
    "https://images.pexels.com/photos/35072278/pexels-photo-35072278.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1759646850616-8bc3e6567ea5?w=800",
    "https://images.pexels.com/photos/31737301/pexels-photo-31737301.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  chilli: [
    "https://images.pexels.com/photos/10899475/pexels-photo-10899475.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/31278860/pexels-photo-31278860.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  potato: [
    "https://images.unsplash.com/photo-1764587492501-bf8b61c09792?w=800",
    "https://images.pexels.com/photos/30624993/pexels-photo-30624993.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1744659751904-3b2e5c095323?w=800"
  ],
  onion: [
    "https://images.unsplash.com/photo-1683355739329-cea18ba93f02?w=800",
    "https://images.pexels.com/photos/34894940/pexels-photo-34894940.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1593629718894-e9a8f9f65d01?w=800"
  ],
  wheat: [
    "https://images.unsplash.com/photo-1673200674067-1923f239194d?w=800",
    "https://images.pexels.com/photos/30297986/pexels-photo-30297986.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  carrot: [
    "https://images.unsplash.com/photo-1757332914679-0906a57881e1?w=800",
    "https://images.pexels.com/photos/35810240/pexels-photo-35810240.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  mango: [
    "https://images.pexels.com/photos/30893227/pexels-photo-30893227.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/5640033/pexels-photo-5640033.jpeg?auto=compress&cs=tinysrgb&w=800"
  ],
  cauliflower: [
    "https://images.pexels.com/photos/31508561/pexels-photo-31508561.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1613743990305-736d763f3d70?w=800"
  ],
  cabbage: [
    "https://images.pexels.com/photos/18717510/pexels-photo-18717510.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.unsplash.com/photo-1609126986933-e3c84f19d49c?w=800"
  ]
};

function getCropImage(crop: string, index = 0) {
  const key = crop.toLowerCase().replace(/\s+/g, "");
  const images = CROP_IMAGES[key as keyof typeof CROP_IMAGES] || CROP_IMAGES.tomato;
  return images[index % images.length];
}

// Extended farmer database
const FARMERS = [
  { name: "Meera Farms", wallet: "0x8b4A...1C3f", location: "Nashik, Maharashtra", trustScore: 96 },
  { name: "Green Delta Collective", wallet: "0x4c7E...8899", location: "Thanjavur, Tamil Nadu", trustScore: 98 },
  { name: "Raj Agro", wallet: "0x91a2...7740", location: "Guntur, Andhra Pradesh", trustScore: 82 },
  { name: "Punjab Kisaan Co-op", wallet: "0x2bF8...4421", location: "Ludhiana, Punjab", trustScore: 94 },
  { name: "Karnataka Organic", wallet: "0x6dE2...9988", location: "Mysore, Karnataka", trustScore: 97 },
  { name: "Vidarbha Farmers Union", wallet: "0x3cA1...5567", location: "Nagpur, Maharashtra", trustScore: 91 },
  { name: "Godavari Agri Trust", wallet: "0x7fB9...3345", location: "Rajahmundry, AP", trustScore: 89 },
  { name: "Tamil Organic Farms", wallet: "0x9eC4...6612", location: "Coimbatore, Tamil Nadu", trustScore: 95 },
  { name: "Gujarat Fresh Produce", wallet: "0x1aD5...7789", location: "Ahmedabad, Gujarat", trustScore: 93 },
  { name: "Konkan Growers", wallet: "0x5bE6...2234", location: "Ratnagiri, Maharashtra", trustScore: 90 },
  { name: "Telangana Harvest Co.", wallet: "0x8cF7...1123", location: "Warangal, Telangana", trustScore: 88 },
  { name: "MP Kisan Sangathan", wallet: "0x4dG8...9901", location: "Indore, MP", trustScore: 92 }
];

let listings: Listing[] = [
  // TOMATOES - Multiple sellers
  {
    id: "listing-tomato-001",
    batchId: "BATCH-TOM-2401",
    crop: "Fresh Tomatoes",
    farmerName: "Meera Farms",
    farmerWallet: "0x8b4A...1C3f",
    location: "Nashik, Maharashtra",
    quantityKg: 900,
    pricePerKg: 28,
    harvestDate: "2026-03-29",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("tomato", 0)],
    description: "Premium hybrid tomatoes, hand-picked same day. Cold-chain ready with ripeness guaranteed. Perfect for retail and restaurants.",
    liveRoomId: "room-tomato-001",
    trustScore: 96,
    farmer: FARMERS[0],
    aiAnalysis: {
      crop: "Tomato",
      disease: "Healthy",
      qualityGrade: "A",
      confidence: 0.94,
      freshness: 0.92,
      suggestedPricePerKg: 30,
      recommendations: ["Keep ventilated during transport.", "Dispatch within 24 hours for best shelf life."]
    }
  },
  {
    id: "listing-tomato-002",
    batchId: "BATCH-TOM-2402",
    crop: "Organic Cherry Tomatoes",
    farmerName: "Karnataka Organic",
    farmerWallet: "0x6dE2...9988",
    location: "Mysore, Karnataka",
    quantityKg: 350,
    pricePerKg: 45,
    harvestDate: "2026-03-30",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("tomato", 1)],
    description: "Certified organic cherry tomatoes. Sweet, juicy, and pesticide-free. Ideal for salads and gourmet cooking.",
    liveRoomId: "room-tomato-002",
    trustScore: 97,
    farmer: FARMERS[4],
    aiAnalysis: {
      crop: "Cherry Tomato",
      disease: "Healthy",
      qualityGrade: "A+",
      confidence: 0.97,
      freshness: 0.95,
      suggestedPricePerKg: 48,
      recommendations: ["Premium quality - suitable for export", "Store at 12-15°C"]
    }
  },
  {
    id: "listing-tomato-003",
    batchId: "BATCH-TOM-2403",
    crop: "Roma Tomatoes",
    farmerName: "Gujarat Fresh Produce",
    farmerWallet: "0x1aD5...7789",
    location: "Ahmedabad, Gujarat",
    quantityKg: 1200,
    pricePerKg: 24,
    harvestDate: "2026-03-28",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("tomato", 2)],
    description: "Bulk Roma tomatoes perfect for processing, sauces, and paste. Firm texture with excellent shelf life.",
    liveRoomId: "room-tomato-003",
    trustScore: 93,
    farmer: FARMERS[8]
  },

  // RICE - Multiple sellers
  {
    id: "listing-rice-001",
    batchId: "BATCH-RICE-8812",
    crop: "Premium Ponni Rice",
    farmerName: "Green Delta Collective",
    farmerWallet: "0x4c7E...8899",
    location: "Thanjavur, Tamil Nadu",
    quantityKg: 2200,
    pricePerKg: 44,
    harvestDate: "2026-03-20",
    status: "escrow_locked",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("rice", 0)],
    description: "Premium ponni rice with moisture test report. Aromatic and fluffy when cooked. Verified origin with lab reports.",
    liveRoomId: "room-rice-001",
    trustScore: 98,
    farmer: FARMERS[1],
    aiAnalysis: {
      crop: "Rice",
      disease: "Healthy",
      qualityGrade: "A+",
      confidence: 0.97,
      freshness: 0.86,
      suggestedPricePerKg: 46,
      recommendations: ["Store below 14% moisture.", "Seal lot after final bagging."]
    }
  },
  {
    id: "listing-rice-002",
    batchId: "BATCH-RICE-8813",
    crop: "Basmati Rice",
    farmerName: "Punjab Kisaan Co-op",
    farmerWallet: "0x2bF8...4421",
    location: "Ludhiana, Punjab",
    quantityKg: 5000,
    pricePerKg: 65,
    harvestDate: "2026-03-15",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("rice", 1)],
    description: "Long-grain aged Basmati rice. Extra-long grains with signature aroma. Ideal for biryani and special occasions.",
    liveRoomId: "room-rice-002",
    trustScore: 94,
    farmer: FARMERS[3]
  },
  {
    id: "listing-rice-003",
    batchId: "BATCH-RICE-8814",
    crop: "Sona Masoori Rice",
    farmerName: "Telangana Harvest Co.",
    farmerWallet: "0x8cF7...1123",
    location: "Warangal, Telangana",
    quantityKg: 3500,
    pricePerKg: 38,
    harvestDate: "2026-03-22",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("rice", 2)],
    description: "Premium Sona Masoori - lightweight and aromatic. Low glycemic index, perfect for daily cooking.",
    liveRoomId: "room-rice-003",
    trustScore: 88,
    farmer: FARMERS[10]
  },

  // POTATOES
  {
    id: "listing-potato-001",
    batchId: "BATCH-POT-4401",
    crop: "Fresh Potatoes",
    farmerName: "MP Kisan Sangathan",
    farmerWallet: "0x4dG8...9901",
    location: "Indore, MP",
    quantityKg: 8000,
    pricePerKg: 18,
    harvestDate: "2026-03-25",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("potato", 0)],
    description: "Premium table potatoes, sorted and graded. Ideal for chips, fries, and cooking. Bulk discount available.",
    liveRoomId: "room-potato-001",
    trustScore: 92,
    farmer: FARMERS[11]
  },
  {
    id: "listing-potato-002",
    batchId: "BATCH-POT-4402",
    crop: "Baby Potatoes",
    farmerName: "Punjab Kisaan Co-op",
    farmerWallet: "0x2bF8...4421",
    location: "Ludhiana, Punjab",
    quantityKg: 1500,
    pricePerKg: 32,
    harvestDate: "2026-03-28",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("potato", 1)],
    description: "Premium baby potatoes - tender and creamy. Perfect for roasting, salads, and gourmet dishes.",
    liveRoomId: "room-potato-002",
    trustScore: 94,
    farmer: FARMERS[3]
  },

  // ONIONS
  {
    id: "listing-onion-001",
    batchId: "BATCH-ONI-5501",
    crop: "Red Onions",
    farmerName: "Vidarbha Farmers Union",
    farmerWallet: "0x3cA1...5567",
    location: "Nagpur, Maharashtra",
    quantityKg: 6000,
    pricePerKg: 22,
    harvestDate: "2026-03-26",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("onion", 0)],
    description: "Fresh red onions, properly cured and sorted. Strong flavor with excellent storage life.",
    liveRoomId: "room-onion-001",
    trustScore: 91,
    farmer: FARMERS[5]
  },
  {
    id: "listing-onion-002",
    batchId: "BATCH-ONI-5502",
    crop: "White Onions",
    farmerName: "Gujarat Fresh Produce",
    farmerWallet: "0x1aD5...7789",
    location: "Ahmedabad, Gujarat",
    quantityKg: 4000,
    pricePerKg: 25,
    harvestDate: "2026-03-27",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("onion", 1)],
    description: "Premium white onions with mild, sweet flavor. Ideal for salads, salsas, and garnishing.",
    liveRoomId: "room-onion-002",
    trustScore: 93,
    farmer: FARMERS[8]
  },

  // WHEAT
  {
    id: "listing-wheat-001",
    batchId: "BATCH-WHT-6601",
    crop: "Sharbati Wheat",
    farmerName: "MP Kisan Sangathan",
    farmerWallet: "0x4dG8...9901",
    location: "Indore, MP",
    quantityKg: 15000,
    pricePerKg: 28,
    harvestDate: "2026-03-10",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("wheat", 0)],
    description: "Premium Sharbati wheat - known for soft texture and sweet taste. Excellent for chapatis and bread.",
    liveRoomId: "room-wheat-001",
    trustScore: 92,
    farmer: FARMERS[11]
  },
  {
    id: "listing-wheat-002",
    batchId: "BATCH-WHT-6602",
    crop: "Durum Wheat",
    farmerName: "Punjab Kisaan Co-op",
    farmerWallet: "0x2bF8...4421",
    location: "Ludhiana, Punjab",
    quantityKg: 10000,
    pricePerKg: 32,
    harvestDate: "2026-03-12",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("wheat", 1)],
    description: "High-protein durum wheat. Perfect for pasta, semolina, and industrial processing.",
    liveRoomId: "room-wheat-002",
    trustScore: 94,
    farmer: FARMERS[3]
  },

  // GREEN CHILLIES
  {
    id: "listing-chilli-001",
    batchId: "BATCH-CHI-7701",
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
    images: [getCropImage("chilli", 0)],
    description: "Fresh green chillies from Guntur. Awaiting re-verification after quality check.",
    liveRoomId: "room-chilli-001",
    trustScore: 82,
    farmer: FARMERS[2]
  },
  {
    id: "listing-chilli-002",
    batchId: "BATCH-CHI-7702",
    crop: "Bird Eye Chilli",
    farmerName: "Godavari Agri Trust",
    farmerWallet: "0x7fB9...3345",
    location: "Rajahmundry, AP",
    quantityKg: 200,
    pricePerKg: 85,
    harvestDate: "2026-03-29",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("chilli", 1)],
    description: "Premium bird eye chillies - extremely hot and aromatic. Ideal for pickles and spice blends.",
    liveRoomId: "room-chilli-002",
    trustScore: 89,
    farmer: FARMERS[6]
  },

  // CARROTS
  {
    id: "listing-carrot-001",
    batchId: "BATCH-CAR-8801",
    crop: "Fresh Carrots",
    farmerName: "Karnataka Organic",
    farmerWallet: "0x6dE2...9988",
    location: "Mysore, Karnataka",
    quantityKg: 800,
    pricePerKg: 35,
    harvestDate: "2026-03-28",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("carrot", 0)],
    description: "Sweet organic carrots, freshly harvested. Rich in beta-carotene. Perfect for juicing and salads.",
    liveRoomId: "room-carrot-001",
    trustScore: 97,
    farmer: FARMERS[4]
  },
  {
    id: "listing-carrot-002",
    batchId: "BATCH-CAR-8802",
    crop: "Red Carrots",
    farmerName: "Tamil Organic Farms",
    farmerWallet: "0x9eC4...6612",
    location: "Coimbatore, Tamil Nadu",
    quantityKg: 600,
    pricePerKg: 40,
    harvestDate: "2026-03-29",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("carrot", 1)],
    description: "Traditional red carrots with intense color and sweetness. Excellent for traditional recipes.",
    liveRoomId: "room-carrot-002",
    trustScore: 95,
    farmer: FARMERS[7]
  },

  // MANGOES
  {
    id: "listing-mango-001",
    batchId: "BATCH-MNG-9901",
    crop: "Alphonso Mangoes",
    farmerName: "Konkan Growers",
    farmerWallet: "0x5bE6...2234",
    location: "Ratnagiri, Maharashtra",
    quantityKg: 500,
    pricePerKg: 180,
    harvestDate: "2026-03-30",
    status: "verified",
    qualityGrade: "A+",
    verified: true,
    images: [getCropImage("mango", 0)],
    description: "Premium Alphonso mangoes from Ratnagiri - the king of mangoes. GI certified with carbide-free ripening.",
    liveRoomId: "room-mango-001",
    trustScore: 90,
    farmer: FARMERS[9]
  },
  {
    id: "listing-mango-002",
    batchId: "BATCH-MNG-9902",
    crop: "Kesar Mangoes",
    farmerName: "Gujarat Fresh Produce",
    farmerWallet: "0x1aD5...7789",
    location: "Ahmedabad, Gujarat",
    quantityKg: 800,
    pricePerKg: 120,
    harvestDate: "2026-03-28",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("mango", 1)],
    description: "Sweet Kesar mangoes with rich golden flesh. Perfect for desserts, shakes, and fresh eating.",
    liveRoomId: "room-mango-002",
    trustScore: 93,
    farmer: FARMERS[8]
  },

  // CAULIFLOWER
  {
    id: "listing-cauliflower-001",
    batchId: "BATCH-CAU-1001",
    crop: "Fresh Cauliflower",
    farmerName: "Punjab Kisaan Co-op",
    farmerWallet: "0x2bF8...4421",
    location: "Ludhiana, Punjab",
    quantityKg: 1200,
    pricePerKg: 28,
    harvestDate: "2026-03-29",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("cauliflower", 0)],
    description: "Fresh, white cauliflower heads. Tightly packed florets with no blemishes. Cold storage ready.",
    liveRoomId: "room-cauliflower-001",
    trustScore: 94,
    farmer: FARMERS[3]
  },

  // CABBAGE
  {
    id: "listing-cabbage-001",
    batchId: "BATCH-CAB-1101",
    crop: "Green Cabbage",
    farmerName: "Karnataka Organic",
    farmerWallet: "0x6dE2...9988",
    location: "Mysore, Karnataka",
    quantityKg: 2000,
    pricePerKg: 15,
    harvestDate: "2026-03-28",
    status: "verified",
    qualityGrade: "A",
    verified: true,
    images: [getCropImage("cabbage", 0)],
    description: "Crisp green cabbage, organically grown. Perfect for salads, stir-fry, and fermentation.",
    liveRoomId: "room-cabbage-001",
    trustScore: 97,
    farmer: FARMERS[4]
  }
];

let orders: Order[] = [
  {
    id: "order-001",
    listingId: "listing-rice-001",
    batchId: "BATCH-RICE-8812",
    buyerName: "Metro Fresh Foods",
    buyerWallet: "0x0aaB...2390",
    quantityKg: 800,
    totalAmount: 35200,
    escrowStatus: "locked",
    createdAt: isoMinutesAgo(160)
  },
  {
    id: "order-002",
    listingId: "listing-tomato-001",
    batchId: "BATCH-TOM-2401",
    buyerName: "Fresh Basket Retail",
    buyerWallet: "0x1bBc...3401",
    quantityKg: 400,
    totalAmount: 11200,
    escrowStatus: "pending",
    createdAt: isoMinutesAgo(45)
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

let videoRooms: VideoRoom[] = listings.map(listing => ({
  id: listing.liveRoomId ?? id("room"),
  listingId: listing.id,
  farmerName: listing.farmerName,
  createdAt: isoMinutesAgo(Math.floor(Math.random() * 300))
}));

let fraudFlags: FraudFlag[] = listings.flatMap((listing) => evaluateFraud(listing));

export function getListings() {
  return [...listings];
}

export function getFeaturedListings() {
  return listings.filter(l => l.verified).slice(0, 6);
}

export function getListingById(listingId: string) {
  return listings.find((listing) => listing.id === listingId);
}

export function getListingByRoomId(roomId: string) {
  return listings.find((listing) => (listing.liveRoomId ?? `room-${listing.id}`) === roomId);
}

export function upsertListing(input: Listing) {
  const existingIndex = listings.findIndex((listing) => listing.id === input.id);
  const nextListing = { ...input };

  if (existingIndex >= 0) {
    listings[existingIndex] = {
      ...listings[existingIndex],
      ...nextListing
    };

    return listings[existingIndex];
  }

  listings = [nextListing, ...listings];

  const roomId = nextListing.liveRoomId ?? id("room");
  if (!videoRooms.find((room) => room.listingId === nextListing.id)) {
    videoRooms = [
      {
        id: roomId,
        listingId: nextListing.id,
        farmerName: nextListing.farmerName,
        createdAt: new Date().toISOString()
      },
      ...videoRooms
    ];
  }

  return nextListing;
}

export function createListing(input: CreateListingInput) {
  const stableListingId = input.onChainBatchId ? buildOnChainListingId(input.onChainBatchId) : id("listing");
  const stableRoomId = input.onChainBatchId ? buildOnChainRoomId(input.onChainBatchId) : id("room");
  const listing: Listing = {
    id: stableListingId,
    batchId:
      input.batchId ?? `BATCH-${input.crop.toUpperCase().slice(0, 3)}-${input.onChainBatchId ?? Math.floor(Math.random() * 9000 + 1000)}`,
    crop: input.crop,
    farmerName: input.farmerName,
    farmerWallet: input.farmerWallet,
    location: input.location,
    quantityKg: input.quantityKg,
    pricePerKg: input.pricePerKg,
    harvestDate: input.harvestDate,
    status: input.onChainBatchId ? "listed" : "under_review",
    qualityGrade: "B",
    verified: false,
    images: input.images && input.images.length > 0 ? input.images : [getProductImageForCrop(input.crop)],
    description: input.description,
    liveRoomId: stableRoomId,
    trustScore: 68,
    onChainBatchId: input.onChainBatchId,
    onChainTxHash: input.onChainTxHash,
    geoLabel: input.geoLabel ?? input.location
  };

  listings = [listing, ...listings];
  traceEvents = [
    {
      id: id("trace"),
      batchId: listing.batchId,
      title: input.onChainBatchId ? "Batch minted on-chain" : "Listing created",
      detail: input.onChainBatchId
        ? `${listing.crop} batch #${input.onChainBatchId} was published on Polygon Amoy by ${listing.farmerName}.`
        : `${listing.crop} batch submitted by ${listing.farmerName}.`,
      status: "done",
      timestamp: new Date().toISOString(),
      txHash: input.onChainTxHash
    },
    ...(input.onChainBatchId
      ? [
          {
            id: id("trace"),
            batchId: listing.batchId,
            title: "Marketplace listing created",
            detail: `${listing.quantityKg} kg listed on-chain at Rs ${listing.pricePerKg}/kg.`,
            status: "done" as const,
            timestamp: new Date().toISOString(),
            txHash: input.onChainTxHash
          }
        ]
      : []),
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
        title: order.onChainOrderId ? "Escrow locked on-chain" : "Escrow locked",
        detail: order.onChainOrderId
          ? `${order.buyerName} locked payment on-chain for ${order.quantityKg} kg as order #${order.onChainOrderId}.`
          : `${order.buyerName} locked payment for ${order.quantityKg} kg.`,
        status: "done",
        timestamp: order.createdAt,
        txHash: order.onChainTxHash ?? "0xescrow-demo-locked"
      },
      ...traceEvents
    ];
  }

  return order;
}

export function getOrders() {
  return [...orders];
}

export function getOrderById(orderId: string) {
  return orders.find((order) => order.id === orderId);
}

export function upsertOrder(input: Order) {
  const existingIndex = orders.findIndex((order) => order.id === input.id);
  const nextOrder = { ...input };

  if (existingIndex >= 0) {
    orders[existingIndex] = {
      ...orders[existingIndex],
      ...nextOrder
    };

    return orders[existingIndex];
  }

  orders = [nextOrder, ...orders];
  return nextOrder;
}

export function updateOrderStatus(input: {
  orderId: string;
  escrowStatus: Order["escrowStatus"];
  onChainTxHash?: string;
}) {
  const order = getOrderById(input.orderId);
  if (!order) {
    return undefined;
  }

  order.escrowStatus = input.escrowStatus;
  if (input.onChainTxHash) {
    order.onChainTxHash = input.onChainTxHash;
  }

  const listing = getListingById(order.listingId);
  if (listing) {
    if (input.escrowStatus === "released") {
      listing.status = "completed";
    } else if (input.escrowStatus === "refunded") {
      listing.status = "verified";
    } else if (input.escrowStatus === "disputed") {
      listing.status = "flagged";
    }

    const title =
      input.escrowStatus === "released"
        ? "Escrow released"
        : input.escrowStatus === "refunded"
          ? "Buyer refunded"
          : input.escrowStatus === "disputed"
            ? "Escrow disputed"
            : "Order updated";

    const detail =
      input.escrowStatus === "released"
        ? `${order.buyerName} released the escrow payment for ${listing.crop}.`
        : input.escrowStatus === "refunded"
          ? `${order.buyerName} was refunded for ${listing.crop}.`
          : input.escrowStatus === "disputed"
            ? `${order.buyerName} raised a dispute for ${listing.crop}.`
            : `Order ${order.id} changed to ${input.escrowStatus}.`;

    traceEvents = [
      {
        id: id("trace"),
        batchId: listing.batchId,
        title,
        detail,
        status: input.escrowStatus === "disputed" ? "flagged" : "done",
        timestamp: new Date().toISOString(),
        txHash: input.onChainTxHash
      },
      ...traceEvents
    ];
  }

  return order;
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

export function recordVideoVerification(input: {
  roomId: string;
  listingId?: string;
  onChainBatchId?: number;
  verificationReference: string;
  expertResult: string;
  aiQualityScore: number;
  txHash?: string;
}) {
  const listing =
    getListingByRoomId(input.roomId) ??
    (input.listingId ? getListingById(input.listingId) : undefined) ??
    (input.onChainBatchId ? listings.find((item) => item.onChainBatchId === input.onChainBatchId) : undefined);
  if (!listing) {
    return undefined;
  }

  listing.verified = true;
  if (listing.status === "listed" || listing.status === "under_review" || listing.status === "flagged") {
    listing.status = "verified";
  }

  if (input.aiQualityScore >= 95) {
    listing.qualityGrade = "A+";
  } else if (input.aiQualityScore >= 80) {
    listing.qualityGrade = "A";
  } else if (input.aiQualityScore >= 60) {
    listing.qualityGrade = "B";
  } else {
    listing.qualityGrade = "C";
  }

  traceEvents = [
    {
      id: id("trace"),
      batchId: listing.batchId,
      title: input.txHash ? "Video verification saved on-chain" : "Video verification completed",
      detail: `${input.expertResult}. Reference: ${input.verificationReference}.`,
      status: "done",
      timestamp: new Date().toISOString(),
      txHash: input.txHash
    },
    ...traceEvents
  ];

  return listing;
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
