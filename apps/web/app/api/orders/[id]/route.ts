import { NextResponse } from "next/server";
import { z } from "zod";
import { getMergedOrderById, getMergedListingById } from "@/lib/contracts/read-models";
import { refundEscrowOnChain, releaseEscrowOnChain } from "@/lib/contracts/server";
import { getOrderById, updateOrderStatus, upsertListing, upsertOrder } from "@/lib/data/mock-db";

const orderActionSchema = z.object({
  action: z.enum(["release", "refund"])
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = orderActionSchema.parse(body);
    const localOrder = getOrderById(params.id);
    const order = localOrder ?? (await getMergedOrderById(params.id));

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (!localOrder) {
      const mergedListing = await getMergedListingById(order.listingId);
      if (mergedListing) {
        upsertListing(mergedListing);
      }
      upsertOrder(order);
    }

    let txHash = order.onChainTxHash;

    if (order.onChainOrderId) {
      if (parsed.action === "release") {
        txHash = (await releaseEscrowOnChain(order.onChainOrderId)).transactionHash;
      } else {
        txHash = (await refundEscrowOnChain(order.onChainOrderId)).transactionHash;
      }
    }

    const updated = updateOrderStatus({
      orderId: order.id,
      escrowStatus: parsed.action === "release" ? "released" : "refunded",
      onChainTxHash: txHash
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update order"
      },
      { status: 400 }
    );
  }
}
