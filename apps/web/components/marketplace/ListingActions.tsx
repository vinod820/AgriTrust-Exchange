"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
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
    setStatus("Locking escrow order...");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        listingId: listing.id,
        batchId: listing.batchId,
        buyerName: "Fresh Basket Retail",
        buyerWallet: "0xB00y...9981",
        quantityKg: Math.min(200, listing.quantityKg),
        totalAmount: Math.min(200, listing.quantityKg) * listing.pricePerKg,
        escrowStatus: "locked"
      })
    });

    const body = await response.json();
    if (response.ok) {
      setStatus(`Escrow order ${body.id} created. Listing moved to escrow locked state.`);
      router.refresh();
      return;
    }

    setStatus(body.error ?? "Escrow action failed.");
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
        <button className="button" onClick={runAiAnalysis}>
          Run AI analysis
        </button>
        <button className="ghost-button" onClick={lockEscrow}>
          Lock escrow
        </button>
        <Link className="ghost-button" href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`}>
          Open video room
        </Link>
        <Link className="ghost-button" href={`/trace/${listing.batchId}`}>
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
