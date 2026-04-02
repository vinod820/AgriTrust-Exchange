import { NextResponse } from "next/server";
import { z } from "zod";
import { getMergedListingById, mergeListingsWithChain, mergeOrdersWithChain } from "@/lib/contracts/read-models";
import { createOrder, getListingById, getListings, getOrders, upsertListing } from "@/lib/data/mock-db";

const orderSchema = z.object({
  listingId: z.string().min(2),
  batchId: z.string().min(2),
  buyerName: z.string().min(2),
  buyerWallet: z.string().min(4),
  quantityKg: z.number().positive(),
  totalAmount: z.number().nonnegative(),
  escrowStatus: z.enum(["pending", "locked", "released", "refunded", "disputed"]),
  onChainOrderId: z.number().int().positive().optional(),
  onChainTxHash: z.string().min(4).optional()
});

export async function GET() {
  const listings = await mergeListingsWithChain(getListings());
  return NextResponse.json(await mergeOrdersWithChain(getOrders(), listings));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.parse(body);

    if (!getListingById(parsed.listingId)) {
      const mergedListing = await getMergedListingById(parsed.listingId);
      if (mergedListing) {
        upsertListing(mergedListing);
      }
    }

    const order = createOrder(parsed);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create order"
      },
      { status: 400 }
    );
  }
}

