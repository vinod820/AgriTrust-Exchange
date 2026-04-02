import { NextResponse } from "next/server";
import { analyzeCropImage } from "@/lib/api/ai";
import { getMergedListingById } from "@/lib/contracts/read-models";
import { getListingById, updateListingAnalysis, upsertListing } from "@/lib/data/mock-db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const localListing = getListingById(params.id);
  const listing = localListing ?? (await getMergedListingById(params.id));
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (!localListing) {
    upsertListing(listing);
  }

  const analysis = await analyzeCropImage(listing.id, listing.crop, listing.images[0]);
  const updated = updateListingAnalysis(listing.id, analysis);

  return NextResponse.json(updated ?? { ...listing, aiAnalysis: analysis });
}

