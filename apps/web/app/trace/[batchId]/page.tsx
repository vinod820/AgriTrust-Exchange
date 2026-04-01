import Link from "next/link";
import { notFound } from "next/navigation";
import { TraceTimeline } from "@/components/trace/TraceTimeline";
import { getListings, getTrace } from "@/lib/data/mock-db";

export default function TracePage({ params }: { params: { batchId: string } }) {
  const listing = getListings().find((item) => item.batchId === params.batchId);
  if (!listing) {
    notFound();
  }

  const events = getTrace(params.batchId);

  return (
    <main className="page-stack">
      <section className="trace-hero-grid">
        <section className="card detail-product-card">
          <div className="detail-product-grid">
            <div className="detail-media">
              <img src={listing.images[0]} alt={`${listing.crop} trace image`} />
            </div>
            <div className="detail-copy">
              <p className="eyebrow">Public batch trace</p>
              <h1>{listing.crop} origin proof</h1>
              <p>
                This page helps buyers, consumers, and judges verify the batch without reading technical blockchain
                screens.
              </p>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Batch</span>
                  <strong>{listing.batchId}</strong>
                </div>
                <div className="summary-item">
                  <span>Farmer</span>
                  <strong>{listing.farmerName}</strong>
                </div>
                <div className="summary-item">
                  <span>Origin</span>
                  <strong>{listing.location}</strong>
                </div>
                <div className="summary-item">
                  <span>AI grade</span>
                  <strong>{listing.qualityGrade}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sidebar-stack">
          <section className="card">
            <p className="kicker">Trust package</p>
            <h3>Verification summary</h3>
            <div className="info-list">
              <div className="info-row">
                <span>Trust score</span>
                <strong>{listing.trustScore}</strong>
              </div>
              <div className="info-row">
                <span>Harvest date</span>
                <strong>{listing.harvestDate}</strong>
              </div>
              <div className="info-row">
                <span>Status</span>
                <strong>{listing.status.replaceAll("_", " ")}</strong>
              </div>
              <div className="info-row">
                <span>Wallet</span>
                <strong className="mono">{listing.farmerWallet}</strong>
              </div>
            </div>
          </section>

          <section className="card support-card">
            <p className="kicker">Next step</p>
            <h3>Continue exploring</h3>
            <div className="button-row">
              <Link className="button" href="/buyer" data-voice="browse marketplace open buyer page buyer marketplace">
                Browse marketplace
              </Link>
              <Link className="ghost-button" href="/consumer" data-voice="open consumer view consumer page verify page">
                Consumer view
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="card">
        <p className="kicker">Timeline</p>
        <h3>Farm-to-market events</h3>
        <TraceTimeline events={events} />
      </section>
    </main>
  );
}
