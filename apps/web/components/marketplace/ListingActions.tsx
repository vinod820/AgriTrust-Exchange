"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { createEscrowOrder, getWalletAddress } from "@/lib/contracts/client";
import { isBlockchainConfigured } from "@/lib/contracts/config";
import { Listing } from "@/lib/types";

export function ListingActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [status, setStatus] = useState("Ready for AI analysis, live verification, or escrow purchase.");

  async function runAiAnalysis() {
    setStatus("Running AI crop analysis...");
    const response = await fetch(`/api/listings/${listing.id}/analyze`, {
      method: "POST"
    });
    const body = await response.json();
    if (response.ok) {
      startTransition(() => {
        setStatus(`AI updated: ${body.aiAnalysis?.disease ?? "Healthy"} at ${(body.aiAnalysis?.confidence * 100).toFixed(1)}%.`);
      });
      router.refresh();
      return;
    }

    setStatus(body.error ?? "AI analysis failed.");
  }

  async function lockEscrow() {
    const quantityKg = Math.min(200, listing.quantityKg);
    const shouldUseBlockchain = Boolean(listing.onChainBatchId) && isBlockchainConfigured();
    let buyerWallet = "0xB00y...9981";
    let onChainOrder: { orderId: number; transactionHash: string } | null = null;

    try {
      setStatus(shouldUseBlockchain ? "Locking escrow on Polygon Amoy..." : "Locking demo escrow order...");

      if (shouldUseBlockchain && listing.onChainBatchId) {
        buyerWallet = await getWalletAddress();
        onChainOrder = await createEscrowOrder({
          batchId: listing.onChainBatchId,
          quantityKg,
          pricePerKg: listing.pricePerKg,
          deliveryWindowSeconds: 86400
        });
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          listingId: listing.id,
          batchId: listing.batchId,
          buyerName: shouldUseBlockchain ? `Buyer ${buyerWallet.slice(0, 6)}` : "Fresh Basket Retail",
          buyerWallet,
          quantityKg,
          totalAmount: quantityKg * listing.pricePerKg,
          escrowStatus: "locked",
          onChainOrderId: onChainOrder?.orderId,
          onChainTxHash: onChainOrder?.transactionHash
        })
      });

      const body = await response.json();
      if (response.ok) {
        setStatus(
          onChainOrder
            ? `Escrow locked on-chain as order #${onChainOrder.orderId || body.onChainOrderId}.`
            : `Escrow order ${body.id} created in demo mode.`
        );
        router.refresh();
        return;
      }

      setStatus(body.error ?? "Escrow action failed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Escrow action failed.");
    }
  }

  return (
    <section className="card">
      <div className="panel-title-row">
        <div>
          <p className="kicker">Listing actions</p>
          <h3>Operate the buyer flow</h3>
        </div>
        <span className={`status-pill ${listing.verified ? "status-success" : "status-warning"}`}>
          {listing.status.replaceAll("_", " ")}
        </span>
      </div>
      <div className="info-list">
        <div className="info-row">
          <span>Farmer</span>
          <strong>{listing.farmerName}</strong>
        </div>
        <div className="info-row">
          <span>Origin</span>
          <strong>{listing.location}</strong>
        </div>
        <div className="info-row">
          <span>Batch</span>
          <strong>{listing.batchId}</strong>
        </div>
      </div>
      <div className="button-row">
        <button className="button" onClick={runAiAnalysis} data-voice="run ai analysis analyze crop ai check">
          Run AI analysis
        </button>
        <button className="ghost-button" onClick={lockEscrow} data-voice="lock escrow secure payment hold money">
          Lock escrow
        </button>
        <Link className="ghost-button" href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`} data-voice="open video room join call verify live call buyer connect buyer buyer video call">
          Open video room
        </Link>
        <Link className="ghost-button" href={`/trace/${listing.batchId}`} data-voice="open trace page trace verify check supply chain">
          Open trace page
        </Link>
      </div>
      <div className="notice-card">
        <strong>Action status</strong>
        <p>{status}</p>
      </div>
    </section>
  );
}
