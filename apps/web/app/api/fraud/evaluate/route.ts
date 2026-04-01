import { NextResponse } from "next/server";
import { z } from "zod";
import { getListingById } from "@/lib/data/mock-db";
import { evaluateFraud } from "@/lib/fraud/rules";

const fraudSchema = z.object({
  listingId: z.string().min(2)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = fraudSchema.parse(body);
    const listing = getListingById(parsed.listingId);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(evaluateFraud(listing));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to evaluate fraud"
      },
      { status: 400 }
    );
  }
}

