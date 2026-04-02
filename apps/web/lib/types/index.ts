export type Role = "farmer" | "buyer" | "consumer" | "admin";

export type ListingStatus =
  | "draft"
  | "listed"
  | "under_review"
  | "verified"
  | "escrow_locked"
  | "delivered"
  | "completed"
  | "flagged";

export type QualityGrade = "A+" | "A" | "B" | "C";

export type AnalysisResult = {
  crop: string;
  disease: string;
  qualityGrade: QualityGrade;
  confidence: number;
  freshness: number;
  suggestedPricePerKg: number;
  recommendations: string[];
};

export type FarmerProfile = {
  name: string;
  wallet: string;
  location: string;
  trustScore: number;
};

export type Listing = {
  id: string;
  batchId: string;
  crop: string;
  farmerName: string;
  farmerWallet: string;
  location: string;
  quantityKg: number;
  pricePerKg: number;
  harvestDate: string;
  status: ListingStatus;
  qualityGrade: QualityGrade;
  verified: boolean;
  aiAnalysis?: AnalysisResult;
  images: string[];
  description: string;
  liveRoomId?: string;
  trustScore: number;
  farmer?: FarmerProfile;
  onChainBatchId?: number;
  onChainTxHash?: string;
  geoLabel?: string;
};

export type Order = {
  id: string;
  listingId: string;
  batchId: string;
  buyerName: string;
  buyerWallet: string;
  quantityKg: number;
  totalAmount: number;
  escrowStatus: "pending" | "locked" | "released" | "refunded" | "disputed";
  createdAt: string;
  onChainOrderId?: number;
  onChainTxHash?: string;
};

export type TraceEvent = {
  id: string;
  batchId: string;
  title: string;
  detail: string;
  status: "done" | "live" | "flagged";
  timestamp: string;
  txHash?: string;
};

export type FraudFlag = {
  id: string;
  batchId: string;
  listingId: string;
  rule: string;
  severity: "low" | "medium" | "high";
  detail: string;
  createdAt: string;
};

export type VideoRoom = {
  id: string;
  listingId: string;
  farmerName: string;
  buyerName?: string;
  createdAt: string;
};

export type CreateListingInput = {
  batchId?: string;
  crop: string;
  farmerName: string;
  farmerWallet: string;
  location: string;
  quantityKg: number;
  pricePerKg: number;
  harvestDate: string;
  description: string;
  images?: string[];
  onChainBatchId?: number;
  onChainTxHash?: string;
  geoLabel?: string;
};

