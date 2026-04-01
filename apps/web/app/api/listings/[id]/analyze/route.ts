import { NextResponse } from "next/server";
import { analyzeCropImage } from "@/lib/api/ai";
import { getListingById, updateListingAnalysis } from "@/lib/data/mock-db";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const listing = getListingById(params.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const analysis = await analyzeCropImage(listing.id, listing.crop, listing.images[0]);
  const updated = updateListingAnalysis(listing.id, analysis);

  return NextResponse.json(updated);
}

