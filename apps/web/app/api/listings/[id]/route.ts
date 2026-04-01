import { NextResponse } from "next/server";
import { getListingById } from "@/lib/data/mock-db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const listing = getListingById(params.id);
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

