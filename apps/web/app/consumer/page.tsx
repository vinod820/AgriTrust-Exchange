"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  QrCode,
  Search,
  Leaf,
  MapPin,
  Calendar,
  CheckCircle2,
  Scan,
  Star,
  Lock,
  ArrowLeft
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/branding/BrandMark";

export default function ConsumerPage() {
  const [batchId, setBatchId] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleScan = () => {
    if (batchId.trim()) {
      setShowResult(true);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Navigation */}
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-voice="go home open home page">
            <BrandMark className="nav-logo" style={{ background: "#00C853", color: "#FDFBF7" }} />
            <div>
              <div className="nav-title">Consumer Portal</div>
              <div className="nav-subtitle">Verify & Trust</div>
            </div>
          </Link>

          <nav className="nav-links">
            <Link href="/consumer" className="nav-link active" data-voice="open consumer page consumer verify page">
              Verify
            </Link>
            <Link href="/buyer" className="nav-link" data-voice="open buyer page browse marketplace">
              Browse
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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: "var(--space-2xl)" }}
        >
          <h1>Verify Your Food's Journey</h1>
          <p style={{ maxWidth: 600, margin: "var(--space-md) auto 0" }}>
            Scan the QR code or enter the batch ID to see the complete supply chain journey.
          </p>
        </motion.div>

        {/* Scan Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card card-lg"
          style={{ 
            maxWidth: 600, 
            margin: "0 auto var(--space-2xl)",
            textAlign: "center"
          }}
        >
          <div style={{
            width: 80,
            height: 80,
            borderRadius: "var(--radius-lg)",
            background: "var(--brand-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-lg)"
          }}>
            <QrCode size={40} color="var(--brand-secondary)" />
          </div>

          <h3 style={{ marginBottom: "var(--space-lg)" }}>Scan or Enter Batch ID</h3>

          <div style={{ display: "flex", gap: "var(--space-md)", marginBottom: "var(--space-lg)" }}>
            <input
              type="text"
              className="input"
              placeholder="Enter batch ID (e.g., BATCH-TOM-2401)"
              value={batchId}
              onChange={e => setBatchId(e.target.value)}
              data-testid="batch-input"
              name="batch-search"
              id="batch-search"
              aria-label="batch search"
            />
            <button 
              className="btn btn-primary"
              onClick={handleScan}
              data-testid="scan-btn"
              data-voice="verify batch search batch trace product check batch"
            >
              <Search size={18} />
              Verify
            </button>
          </div>

          <button className="btn btn-secondary" style={{ marginTop: "var(--space-md)" }} data-voice="open camera to scan scan qr open scanner">
            <Scan size={18} />
            Open Camera to Scan
          </button>
        </motion.div>

        {/* Result Section */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ProductVerification batchId={batchId || "BATCH-TOM-2401"} />
          </motion.div>
        )}

        {/* Demo Card */}
        {!showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: "center" }}
          >
            <p style={{ marginBottom: "var(--space-md)", color: "var(--text-secondary)" }}>
              Try a demo verification:
            </p>
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setBatchId("BATCH-TOM-2401");
                setShowResult(true);
              }}
              data-testid="demo-btn"
              data-voice="view demo verify demo batch demo trace"
            >
              View Demo: BATCH-TOM-2401
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ProductVerification({ batchId }: { batchId: string }) {
  const traceData = {
    crop: "Premium Tomatoes",
    farmer: "Raju Kumar",
    location: "Kolar, Karnataka",
    harvestDate: "2024-01-15",
    quantity: "500 kg",
    grade: "A",
    trustScore: 96,
    verified: true,
    organic: true
  };

  const journey = [
    { step: "Harvested", date: "Jan 15, 2024", location: "Kolar Farm", verified: true },
    { step: "Quality Checked", date: "Jan 15, 2024", location: "AI Analysis", verified: true },
    { step: "Listed on Market", date: "Jan 16, 2024", location: "KrishiVoice Chain", verified: true },
    { step: "Purchased", date: "Jan 18, 2024", location: "Escrow Locked", verified: true },
    { step: "Shipped", date: "Jan 19, 2024", location: "In Transit", verified: true }
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xl)" }}>
      {/* Product Info */}
      <div className="card card-lg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-lg)" }}>
          <div>
            <span className="label label-brand">Verified Product</span>
            <h2 style={{ marginTop: "var(--space-sm)" }}>{traceData.crop}</h2>
          </div>
          <img 
            src="https://static.prod-images.emergentagent.com/jobs/1d7c1506-eeb9-4090-8d04-3e29c3d1b8da/images/e46cdab6b24bebc0f4ca2cfbd63f891b3cf4d29bb1231e418521bf0c9120e164.png"
            alt="Trust Badge"
            style={{ width: 64, height: 64 }}
          />
        </div>

        {/* Trust Meter */}
        <div style={{ 
          padding: "var(--space-lg)", 
          background: "var(--bg-secondary)", 
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-lg)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
            <span style={{ fontWeight: 600 }}>Trust Score</span>
            <span style={{ 
              fontSize: "1.5rem", 
              fontWeight: 700, 
              fontFamily: "Outfit, sans-serif",
              color: "var(--accent-success)"
            }}>
              {traceData.trustScore}%
            </span>
          </div>
          <div className="trust-meter">
            <div className="trust-meter-bar" style={{ height: 12 }}>
              <div className="trust-meter-fill" style={{ width: `${traceData.trustScore}%` }} />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          {[
            { icon: Leaf, label: "Farmer", value: traceData.farmer },
            { icon: MapPin, label: "Origin", value: traceData.location },
            { icon: Calendar, label: "Harvested", value: traceData.harvestDate },
            { icon: Star, label: "Grade", value: `Grade ${traceData.grade}` }
          ].map(item => (
            <div 
              key={item.label}
              className="surface"
              style={{ padding: "var(--space-md)", borderRadius: "var(--radius-md)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: 4 }}>
                <item.icon size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  {item.label}
                </span>
              </div>
              <div style={{ fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-lg)" }}>
          <span className="badge badge-success">
            <CheckCircle2 size={14} /> AI Verified
          </span>
          <span className="badge badge-blockchain">
            <Lock size={14} /> Blockchain Secured
          </span>
          {traceData.organic && (
            <span className="badge badge-trust">
              <Leaf size={14} /> Organic
            </span>
          )}
        </div>
      </div>

      {/* Journey Timeline */}
      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Supply Chain Journey</h3>
        
        <div className="timeline">
          {journey.map((step, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-marker">
                <div className="timeline-dot" style={{
                  background: step.verified ? "var(--accent-success)" : "var(--text-muted)"
                }} />
                <div className="timeline-line" />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-title">{step.step}</div>
                  {step.verified && <CheckCircle2 size={16} color="var(--accent-success)" />}
                </div>
                <div className="timeline-date">{step.date}</div>
                <div className="timeline-description">{step.location}</div>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code */}
        <div style={{ 
          textAlign: "center", 
          marginTop: "var(--space-xl)",
          padding: "var(--space-lg)",
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-lg)"
        }}>
          <div className="qr-code" style={{ display: "inline-block", background: "white", padding: "var(--space-md)", borderRadius: "var(--radius-md)" }}>
            <QRCodeSVG 
              value={`https://krishivoice.chain/trace/${batchId}`}
              size={120}
              level="H"
            />
          </div>
          <p style={{ marginTop: "var(--space-md)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            Batch ID: <span className="mono">{batchId}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
