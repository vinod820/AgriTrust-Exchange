import { RoleShell } from "@/components/dashboard/RoleShell";
import { getDashboardMetrics, getFraudFlags, getListings, getOrders } from "@/lib/data/mock-db";

export default function AdminPage() {
  const metrics = getDashboardMetrics();
  const flags = getFraudFlags();
  const orders = getOrders();
  const listings = getListings();

  return (
    <RoleShell
      role="Admin"
      title="Review fraud, escrow, and trust signals from one clean admin view."
      description="This screen is designed for judges and operators who need to understand what is happening quickly, without digging through cluttered controls."
    >
      <section className="metrics-row">
        <article className="card metric-card">
          <span>Flagged lots</span>
          <strong>{metrics.flaggedCount}</strong>
        </article>
        <article className="card metric-card">
          <span>Live rooms</span>
          <strong>{metrics.liveRooms}</strong>
        </article>
        <article className="card metric-card">
          <span>Escrow value</span>
          <strong>Rs {metrics.escrowValue.toLocaleString()}</strong>
        </article>
        <article className="card metric-card">
          <span>Total listings</span>
          <strong>{metrics.totalListings}</strong>
        </article>
      </section>

      <section className="admin-grid">
        <section className="card">
          <div className="panel-title-row">
            <div>
              <p className="kicker">Fraud flags</p>
              <h3>Rules triggered</h3>
            </div>
          </div>
          {flags.length === 0 ? (
            <div className="empty-state">No fraud flags.</div>
          ) : (
            <div className="support-list">
              {flags.map((flag) => (
                <article key={flag.id} className="support-list-item support-list-item-spacious">
                  <div className="split-row">
                    <strong>{flag.rule}</strong>
                    <span className={`status-pill ${flag.severity === "high" ? "status-danger" : "status-warning"}`}>
                      {flag.severity}
                    </span>
                  </div>
                  <p>{listings.find((listing) => listing.id === flag.listingId)?.crop ?? "Listing"} - {flag.batchId}</p>
                  <p>{flag.detail}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card">
          <div className="panel-title-row">
            <div>
              <p className="kicker">Escrow</p>
              <h3>Order monitoring</h3>
            </div>
          </div>
          <div className="support-list">
            {orders.map((order) => (
              <article key={order.id} className="support-list-item support-list-item-spacious">
                <div className="split-row">
                  <strong>{order.buyerName}</strong>
                  <span className="status-pill status-success">{order.escrowStatus}</span>
                </div>
                <p>{order.quantityKg} kg, Rs {order.totalAmount.toLocaleString()}</p>
                <p className="mono">{order.buyerWallet}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card support-card">
          <p className="kicker">Why this admin screen matters</p>
          <h3>Judge-friendly visibility</h3>
          <div className="support-list">
            <div className="support-list-item">
              <strong>See risky lots quickly</strong>
              <p>Flagged listings stay separated from the normal buying flow.</p>
            </div>
            <div className="support-list-item">
              <strong>Explain trust clearly</strong>
              <p>Escrow, AI analysis, and trace history support the marketplace story during demos.</p>
            </div>
            <div className="support-list-item">
              <strong>Keep the UX simple</strong>
              <p>The page focuses on decision-ready signals instead of unreadable technical noise.</p>
            </div>
          </div>
        </section>
      </section>
    </RoleShell>
  );
}
