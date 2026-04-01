import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrder, getOrders } from "@/lib/data/mock-db";

const orderSchema = z.object({
  listingId: z.string().min(2),
  batchId: z.string().min(2),
  buyerName: z.string().min(2),
  buyerWallet: z.string().min(4),
  quantityKg: z.number().positive(),
  totalAmount: z.number().nonnegative(),
  escrowStatus: z.enum(["pending", "locked", "released", "refunded", "disputed"])
});

export async function GET() {
  return NextResponse.json(getOrders());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.parse(body);
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

