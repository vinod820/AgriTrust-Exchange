import { NextResponse } from "next/server";
import { z } from "zod";
import { createListing, getListings } from "@/lib/data/mock-db";

const createListingSchema = z.object({
  crop: z.string().min(2),
  farmerName: z.string().min(2),
  farmerWallet: z.string().min(4),
  location: z.string().min(2),
  quantityKg: z.number().positive(),
  pricePerKg: z.number().positive(),
  harvestDate: z.string().min(4),
  description: z.string().min(8),
  images: z.array(z.string()).optional()
});

export async function GET() {
  return NextResponse.json(getListings());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createListingSchema.parse(body);
    const listing = createListing(parsed);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create listing"
      },
      { status: 400 }
    );
  }
}

