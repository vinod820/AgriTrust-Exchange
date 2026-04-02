import { NextResponse } from "next/server";
import { getMergedListingById } from "@/lib/contracts/read-models";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const listing = await getMergedListingById(params.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

