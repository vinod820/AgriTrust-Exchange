import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { RoleShell } from "@/components/dashboard/RoleShell";
import { getFeaturedListings } from "@/lib/data/mock-db";

export default function ConsumerPage() {
  const listing = getFeaturedListings()[0];
  const traceUrl = `https://demo.agritrust.local/trace/${listing.batchId}`;

  return (
    <RoleShell
      role="Consumer"
      title="Scan once and understand where the product came from."
      description="The consumer experience now looks cleaner and focuses on the three things people care about most: origin, quality, and proof."
    >
      <section className="metrics-row">
        <article className="card metric-card">
          <span>Farmer</span>
          <strong>{listing.farmerName}</strong>
        </article>
        <article className="card metric-card">
          <span>Origin</span>
          <strong>{listing.location}</strong>
        </article>
        <article className="card metric-card">
          <span>Grade</span>
          <strong>{listing.qualityGrade}</strong>
        </article>
        <article className="card metric-card">
          <span>Trust</span>
          <strong>{listing.trustScore}</strong>
        </article>
      </section>

      <section className="consumer-grid">
        <section className="card consumer-product-card">
          <div className="consumer-product-media">
            <img src={listing.images[0]} alt={`${listing.crop} public product view`} />
          </div>
          <div className="consumer-product-copy">
            <p className="eyebrow">Public batch trace</p>
            <h2>{listing.crop} batch {listing.batchId}</h2>
            <p>
              This shareable trust page is designed for buyers, consumers, and judges to understand the product story
              without needing blockchain knowledge.
            </p>
            <div className="summary-grid">
              <div className="summary-item">
                <span>Origin</span>
                <strong>{listing.location}</strong>
              </div>
              <div className="summary-item">
                <span>Farmer</span>
                <strong>{listing.farmerName}</strong>
              </div>
              <div className="summary-item">
                <span>Quality</span>
                <strong>{listing.qualityGrade}</strong>
              </div>
              <div className="summary-item">
                <span>Trust score</span>
                <strong>{listing.trustScore}</strong>
              </div>
            </div>
            <Link className="button" href={`/trace/${listing.batchId}`}>
              Open full trace page
            </Link>
          </div>
        </section>

        <div className="sidebar-stack">
          <section className="card">
            <div className="panel-title-row">
              <div>
                <p className="kicker">QR share</p>
                <h3>Scan to verify the source</h3>
              </div>
            </div>
            <div className="qr-wrap">
              <QRCodeSVG value={traceUrl} size={180} />
            </div>
            <p className="mono">{traceUrl}</p>
          </section>

          <section className="card support-card">
            <p className="kicker">Consumer trust</p>
            <h3>What people can verify</h3>
            <div className="support-list">
              <div className="support-list-item">
                <strong>Real farmer and origin</strong>
                <p>The source is visible immediately instead of hidden in long text.</p>
              </div>
              <div className="support-list-item">
                <strong>Quality and AI signal</strong>
                <p>Grade and analysis stay readable for non-technical users.</p>
              </div>
              <div className="support-list-item">
                <strong>Trace timeline</strong>
                <p>The batch history stays one click away for deeper proof.</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </RoleShell>
  );
}
