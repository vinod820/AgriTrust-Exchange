"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  Eye,
  CheckCircle2,
  Clock,
  Wallet,
  FileWarning,
  ArrowLeft
} from "lucide-react";
import { getListings } from "@/lib/data/mock-db";
import { Listing, Order } from "@/lib/types";
import { BrandMark } from "@/components/branding/BrandMark";

const fraudAlerts = [
  { id: 1, type: "Duplicate Image", listing: "Tomato Batch #234", severity: "high", time: "2 min ago" },
  { id: 2, type: "Location Mismatch", listing: "Rice Lot #891", severity: "medium", time: "15 min ago" },
  { id: 3, type: "Unusual Quantity", listing: "Wheat Batch #567", severity: "low", time: "1 hour ago" }
];

function mapTransactionStatus(status: Order["escrowStatus"]) {
  if (status === "released") {
    return "completed";
  }

  if (status === "locked") {
    return "escrow";
  }

  return status;
}

export default function AdminPage() {
  const [listings, setListings] = useState<Listing[]>(() => getListings());
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [listingResponse, orderResponse] = await Promise.all([
          fetch("/api/listings", { cache: "no-store" }),
          fetch("/api/orders", { cache: "no-store" })
        ]);

        if (listingResponse.ok) {
          const listingData = (await listingResponse.json()) as Listing[];
          if (isMounted) {
            setListings(listingData);
          }
        }

        if (orderResponse.ok) {
          const orderData = (await orderResponse.json()) as Order[];
          if (isMounted) {
            setOrders(orderData);
          }
        }
      } catch {
        // Keep bundled fallback data if the API is unavailable.
      }
    }

    void loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalVolume = listings.reduce((sum, listing) => sum + listing.quantityKg * listing.pricePerKg, 0);
  const recentTransactions = orders.slice(0, 5).map((order) => {
    const listing = listings.find((item) => item.id === order.listingId);

    return {
      id: order.id,
      from: listing?.farmerName ?? "Farmer",
      to: order.buyerName,
      amount: `Rs ${order.totalAmount.toLocaleString()}`,
      status: mapTransactionStatus(order.escrowStatus)
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-voice="go home open home page">
            <BrandMark className="nav-logo" style={{ background: "#E25C3D", color: "#FDFBF7" }} />
            <div>
              <div className="nav-title">Admin Control</div>
              <div className="nav-subtitle">Trust Operations</div>
            </div>
          </Link>

          <nav className="nav-links">
            <Link href="/admin" className="nav-link active" data-voice="open admin page admin dashboard control center">
              Dashboard
            </Link>
            <Link href="/buyer" className="nav-link" data-voice="open buyer page open marketplace">
              Marketplace
            </Link>
          </nav>

          <div className="nav-actions">
            <Link href="/" className="btn btn-secondary btn-sm" data-voice="switch role change role go home">
              <ArrowLeft size={16} />
              Switch Role
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "url(https://static.prod-images.emergentagent.com/jobs/1d7c1506-eeb9-4090-8d04-3e29c3d1b8da/images/16d43294869385ff7e645a91ded99bb1812e8cf956164ea8daae48c4455f3f02.png)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "var(--radius-xl)",
            padding: "var(--space-2xl)",
            marginBottom: "var(--space-xl)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(45, 90, 63, 0.95), rgba(26, 46, 32, 0.9))"
            }}
          />
          <div style={{ position: "relative", zIndex: 1, color: "var(--text-inverse)" }}>
            <h1 style={{ color: "var(--text-inverse)", marginBottom: "var(--space-sm)" }}>Control Center</h1>
            <p style={{ opacity: 0.8, maxWidth: 500 }}>
              Monitor marketplace health, detect fraud, and manage trust across the ecosystem.
            </p>
          </div>
        </motion.div>

        <div className="dashboard-grid stagger-reveal" style={{ marginBottom: "var(--space-xl)" }}>
          <StatCard icon={Shield} label="Trust Score" value="94.2%" change="+2.1%" positive />
          <StatCard icon={AlertTriangle} label="Active Alerts" value="3" change="2 resolved today" positive={false} />
          <StatCard icon={Activity} label="Transactions" value={String(orders.length)} change="Live order sync" positive />
          <StatCard icon={Wallet} label="Total Volume" value={`Rs ${(totalVolume / 100000).toFixed(1)}L`} change="+23%" positive />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
          <div className="card card-lg">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <FileWarning size={20} color="var(--accent-warning)" />
                Fraud Alerts
              </h3>
              <span className="badge badge-warning">{fraudAlerts.length} active</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {fraudAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="surface"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-md)",
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    borderLeft: `4px solid ${
                      alert.severity === "high"
                        ? "var(--accent-warning)"
                        : alert.severity === "medium"
                          ? "#F59E0B"
                          : "var(--text-muted)"
                    }`
                  }}
                  data-testid={`fraud-alert-${alert.id}`}
                >
                  <AlertTriangle
                    size={20}
                    color={
                      alert.severity === "high"
                        ? "var(--accent-warning)"
                        : alert.severity === "medium"
                          ? "#F59E0B"
                          : "var(--text-muted)"
                    }
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{alert.type}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{alert.listing}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{alert.time}</div>
                  <button className="btn btn-secondary btn-sm" data-voice={`review alert ${alert.type.toLowerCase()} ${alert.listing.toLowerCase()}`}>
                    <Eye size={14} /> Review
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="card card-lg">
            <h3 style={{ marginBottom: "var(--space-lg)" }}>Recent Transactions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-md)",
                      padding: "var(--space-sm) 0",
                      borderBottom: index < recentTransactions.length - 1 ? "1px solid rgba(26,46,32,0.06)" : "none"
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          tx.status === "completed"
                            ? "rgba(0,200,83,0.1)"
                            : tx.status === "escrow"
                              ? "rgba(204,255,0,0.2)"
                              : "var(--bg-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {tx.status === "completed" ? (
                        <CheckCircle2 size={18} color="var(--accent-success)" />
                      ) : (
                        <Clock size={18} color="var(--text-muted)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.875rem" }}>{tx.from} to {tx.to}</div>
                      <div style={{ fontWeight: 600 }}>{tx.amount}</div>
                    </div>
                    <span className={`badge ${tx.status === "completed" ? "badge-success" : ""}`}>{tx.status}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  No live transactions yet. Lock an escrow order to see it here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card card-lg" style={{ marginTop: "var(--space-xl)" }}>
          <h3 style={{ marginBottom: "var(--space-lg)" }}>Trust Leaderboard</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-lg)" }}>
            {[
              { name: "Raju Kumar", role: "Farmer", score: 98, transactions: 156 },
              { name: "Arun Patel", role: "Farmer", score: 96, transactions: 124 },
              { name: "Priya Sharma", role: "Buyer", score: 95, transactions: 89 },
              { name: "Vikram Singh", role: "Farmer", score: 94, transactions: 201 }
            ].map((user, index) => (
              <div
                key={index}
                className="surface"
                style={{
                  padding: "var(--space-lg)",
                  borderRadius: "var(--radius-lg)",
                  textAlign: "center"
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "var(--brand-primary)",
                    color: "var(--text-inverse)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    margin: "0 auto var(--space-md)"
                  }}
                >
                  {user.name.charAt(0)}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{user.name}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "var(--space-sm)" }}>{user.role}</div>
                <div className="trust-meter" style={{ marginBottom: "var(--space-sm)" }}>
                  <div className="trust-meter-bar">
                    <div className="trust-meter-fill" style={{ width: `${user.score}%` }} />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                  <span>Score: {user.score}%</span>
                  <span>{user.transactions} txns</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  positive
}: {
  icon: any;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="card metric-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="metric-label">{label}</div>
          <div className="metric-value">{value}</div>
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-md)",
            background: positive ? "rgba(0,200,83,0.1)" : "rgba(226,92,61,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Icon size={24} color={positive ? "var(--accent-success)" : "var(--accent-warning)"} />
        </div>
      </div>
      <div className={`metric-change ${positive ? "metric-change-up" : "metric-change-down"}`}>
        {positive ? <TrendingUp size={14} /> : null} {change}
      </div>
    </div>
  );
}
