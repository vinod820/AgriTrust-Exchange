import { NextResponse } from "next/server";
import { z } from "zod";
import { createListing, getListings } from "@/lib/data/mock-db";
import { mergeListingsWithChain } from "@/lib/contracts/read-models";
import { createListingSchema, getListingFieldErrors, getListingValidationMessage } from "@/lib/listings/validation";

export async function GET() {
  return NextResponse.json(await mergeListingsWithChain(getListings()));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createListingSchema.parse(body);
    const listing = createListing(parsed);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: getListingValidationMessage(error),
          fieldErrors: getListingFieldErrors(error)
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create listing"
      },
      { status: 400 }
    );
  }
}

