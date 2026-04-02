import { NextResponse } from "next/server";
import { z } from "zod";
import { getMergedListingById, getMergedListingByRoomId, getMergedListings } from "@/lib/contracts/read-models";
import { addVerificationOnChain } from "@/lib/contracts/server";
import { getListingById, getListingByRoomId, recordVideoVerification, upsertListing } from "@/lib/data/mock-db";

const verificationSchema = z.object({
  roomId: z.string().min(2),
  listingId: z.string().min(2).optional(),
  onChainBatchId: z.number().int().positive().optional(),
  verificationReference: z.string().min(4),
  expertResult: z.string().min(4).max(240).optional(),
  aiQualityScore: z.number().int().min(0).max(100).optional(),
  txHashOverride: z.string().min(10).optional(),
  signerAddressOverride: z.string().min(10).optional()
});

function getDefaultQualityScore(listing: ReturnType<typeof getListingByRoomId>) {
  if (!listing) {
    return 85;
  }

  if (listing.aiAnalysis?.confidence) {
    return Math.max(0, Math.min(100, Math.round(listing.aiAnalysis.confidence * 100)));
  }

  if (listing.qualityGrade === "A+") {
    return 96;
  }

  if (listing.qualityGrade === "A") {
    return 88;
  }

  if (listing.qualityGrade === "B") {
    return 72;
  }

  return 58;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verificationSchema.parse(body);
    const localListing =
      getListingByRoomId(parsed.roomId) ??
      (parsed.listingId ? getListingById(parsed.listingId) : undefined) ??
      undefined;

    const mergedListingByBatch =
      parsed.onChainBatchId !== undefined
        ? (await getMergedListings()).find((item) => item.onChainBatchId === parsed.onChainBatchId) ?? null
        : null;

    const listing =
      localListing ??
      (await getMergedListingByRoomId(parsed.roomId)) ??
      (parsed.listingId ? await getMergedListingById(parsed.listingId) : null) ??
      mergedListingByBatch;

    if (!listing) {
      return NextResponse.json({ error: "No listing is linked to this verification room." }, { status: 404 });
    }

    if (!listing.onChainBatchId) {
      return NextResponse.json(
        { error: "This room is not linked to an on-chain batch, so verification cannot be saved to the blockchain." },
        { status: 400 }
      );
    }

    const expertResult = parsed.expertResult ?? `Jitsi Meet verification completed for ${listing.crop}.`;
    const aiQualityScore = parsed.aiQualityScore ?? getDefaultQualityScore(listing);

    let txHash = parsed.txHashOverride ?? "";
    let signerAddress = parsed.signerAddressOverride ?? "";

    if (!txHash) {
      const onChainResult = await addVerificationOnChain({
        batchId: listing.onChainBatchId,
        videoHash: parsed.verificationReference,
        expertResult,
        aiQualityScore
      });
      txHash = onChainResult.transactionHash;
      signerAddress = onChainResult.signerAddress;
    }

    if (!localListing) {
      upsertListing(listing);
    }

    const updatedListing = recordVideoVerification({
      roomId: parsed.roomId,
      listingId: parsed.listingId ?? listing.id,
      onChainBatchId: parsed.onChainBatchId ?? listing.onChainBatchId,
      verificationReference: parsed.verificationReference,
      expertResult,
      aiQualityScore,
      txHash
    });

    return NextResponse.json(
      {
        ok: true,
        listingId: listing.id,
        batchId: listing.batchId,
        onChainBatchId: listing.onChainBatchId,
        txHash,
        signerAddress: signerAddress || null,
        listing: updatedListing ?? listing
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to save video verification on-chain"
      },
      { status: 400 }
    );
  }
}
