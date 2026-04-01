import { notFound } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { ListingActions } from "@/components/marketplace/ListingActions";
import { TraceTimeline } from "@/components/trace/TraceTimeline";
import { getListingById, getTrace } from "@/lib/data/mock-db";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = getListingById(params.id);

  if (!listing) {
    notFound();
  }

  const events = getTrace(listing.batchId);

  return (
    <main className="page-stack">
      <section className="detail-layout">
        <section className="card detail-product-card">
          <div className="detail-product-grid">
            <div className="detail-media">
              <img src={listing.images[0]} alt={`${listing.crop} listing image`} />
            </div>
            <div className="detail-copy">
              <p className="eyebrow">{listing.location}</p>
              <h1>{listing.crop}</h1>
              <p>{listing.description}</p>
              <div className="summary-grid">
                <div className="summary-item">
                  <span>Price</span>
                  <strong>Rs {listing.pricePerKg}/kg</strong>
                </div>
                <div className="summary-item">
                  <span>Quantity</span>
                  <strong>{listing.quantityKg} kg</strong>
                </div>
                <div className="summary-item">
                  <span>Quality</span>
                  <strong>{listing.qualityGrade}</strong>
                </div>
                <div className="summary-item">
                  <span>Trust</span>
                  <strong>{listing.trustScore}</strong>
                </div>
              </div>
              <div className="info-list">
                <div className="info-row">
                  <span>Batch ID</span>
                  <strong>{listing.batchId}</strong>
                </div>
                <div className="info-row">
                  <span>Farmer</span>
                  <strong>{listing.farmerName}</strong>
                </div>
                <div className="info-row">
                  <span>Wallet</span>
                  <strong className="mono">{listing.farmerWallet}</strong>
                </div>
                <div className="info-row">
                  <span>Harvest date</span>
                  <strong>{listing.harvestDate}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sidebar-stack">
          <ListingActions listing={listing} />
          <section className="card">
            <div className="panel-title-row">
              <div>
                <p className="kicker">AI summary</p>
                <h3>Quality and recommendation snapshot</h3>
              </div>
            </div>
            {listing.aiAnalysis ? (
              <div className="support-list">
                <div className="info-row">
                  <span>Disease signal</span>
                  <strong>{listing.aiAnalysis.disease}</strong>
                </div>
                <div className="info-row">
                  <span>Confidence</span>
                  <strong>{(listing.aiAnalysis.confidence * 100).toFixed(1)}%</strong>
                </div>
                <div className="info-row">
                  <span>Freshness</span>
                  <strong>{(listing.aiAnalysis.freshness * 100).toFixed(1)}%</strong>
                </div>
                <div className="info-row">
                  <span>Suggested price</span>
                  <strong>Rs {listing.aiAnalysis.suggestedPricePerKg}/kg</strong>
                </div>
                {listing.aiAnalysis.recommendations.map((recommendation) => (
                  <div key={recommendation} className="support-list-item">
                    <p>{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No AI report attached yet.</div>
            )}
          </section>

          <section className="card">
            <p className="kicker">Shareable QR</p>
            <h3>Open the public trace page</h3>
            <div className="qr-wrap">
              <QRCodeSVG value={`https://demo.agritrust.local/trace/${listing.batchId}`} size={160} />
            </div>
          </section>
        </div>
      </section>

      <section className="card">
        <p className="kicker">Timeline</p>
        <h3>Trace events</h3>
        <TraceTimeline events={events} />
      </section>
    </main>
  );
}
