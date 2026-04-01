"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Package,
  Wallet,
  TrendingUp,
  PlusCircle,
  Leaf,
  BarChart3,
  Phone,
  MapPin,
  Star,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";
import { getListings } from "@/lib/data/mock-db";
import { useVoice } from "@/components/voice/VoiceProvider";

const sections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "sell", label: "Sell Crop", icon: PlusCircle },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "wallet", label: "Wallet", icon: Wallet }
];

export default function FarmerPage() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "overview";
  const { isListening, transcript, response, startListening, stopListening } = useVoice();
  
  const myListings = getListings().slice(0, 3);
  const totalKg = myListings.reduce((sum, l) => sum + l.quantityKg, 0);
  const earnings = myListings.reduce((sum, l) => sum + (l.quantityKg * l.pricePerKg * 0.3), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Navigation */}
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-testid="nav-brand">
            <div className="nav-logo">KV</div>
            <div>
              <div className="nav-title">Farmer Portal</div>
              <div className="nav-subtitle">Voice-First Selling</div>
            </div>
          </Link>

          <nav className="nav-links" data-testid="nav-links">
            <Link href="/farmer" className="nav-link active" data-voice="open farmer page farmer dashboard">
              Dashboard
            </Link>
            <Link href="/buyer" className="nav-link" data-voice="open buyer page open marketplace buyer marketplace">
              Marketplace
            </Link>
          </nav>

          <div className="nav-actions">
            <Link
              href="/"
              className="btn btn-secondary btn-sm"
              data-testid="switch-role-btn"
              data-voice="switch role change role go home choose role"
            >
              <ArrowLeft size={16} />
              Switch Role
            </Link>
          </div>
        </div>
      </header>
      
      <main className="dashboard">
        {/* Dashboard Header */}
        <motion.div 
          className="dashboard-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="dashboard-title">Welcome back, Farmer</h1>
            <p className="dashboard-subtitle">Your crops are ready to reach buyers. Let's make it happen.</p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <button 
              className="btn btn-secondary"
              onClick={isListening ? stopListening : startListening}
              data-testid="voice-btn-header"
              data-voice="start voice command stop voice command voice help"
            >
              <Mic size={18} />
              {isListening ? "Listening..." : "Voice Command"}
            </button>
            <Link
              href="/farmer?section=sell"
              className="btn btn-primary"
              data-testid="new-listing-btn"
              data-voice="create listing add listing register crop sell crop"
            >
              <PlusCircle size={18} />
              New Listing
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div 
          className="dashboard-grid stagger-reveal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="card metric-card" data-testid="stat-listings">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="metric-label">Active Listings</div>
                <div className="metric-value">{myListings.length}</div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "var(--radius-md)",
                background: "rgba(45, 90, 63, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Package size={24} color="var(--brand-primary)" />
              </div>
            </div>
            <div className="metric-change metric-change-up">
              <TrendingUp size={14} /> +2 this week
            </div>
          </div>

          <div className="card metric-card" data-testid="stat-quantity">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="metric-label">Total Quantity</div>
                <div className="metric-value">{totalKg.toLocaleString()} kg</div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "var(--radius-md)",
                background: "rgba(204, 255, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Leaf size={24} color="#7D9F00" />
              </div>
            </div>
          </div>

          <div className="card metric-card" data-testid="stat-earnings">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="metric-label">Est. Earnings</div>
                <div className="metric-value">₹{earnings.toLocaleString()}</div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "var(--radius-md)",
                background: "rgba(0, 200, 83, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <TrendingUp size={24} color="var(--accent-success)" />
              </div>
            </div>
          </div>

          <div className="card metric-card" data-testid="stat-trust">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div className="metric-label">Trust Score</div>
                <div className="metric-value">92%</div>
              </div>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: "var(--radius-md)",
                background: "rgba(45, 90, 63, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Star size={24} color="var(--brand-primary)" />
              </div>
            </div>
            <div className="trust-meter" style={{ marginTop: "var(--space-sm)" }}>
              <div className="trust-meter-bar">
                <div className="trust-meter-fill" style={{ width: "92%" }} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Navigation */}
        <div className="tabs" data-testid="section-tabs">
          {sections.map(section => {
            const Icon = section.icon;
            const isActive = section.id === activeSection;
            return (
              <Link
                key={section.id}
                href={`/farmer?section=${section.id}`}
                className={`tab ${isActive ? "active" : ""}`}
                data-testid={`tab-${section.id}`}
                data-voice={`open ${section.label.toLowerCase()} section ${section.label.toLowerCase()} tab`}
              >
                <Icon size={18} style={{ marginRight: 8 }} />
                {section.label}
              </Link>
            );
          })}
        </div>

        {/* Section Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSection === "overview" && <OverviewSection listings={myListings} />}
            {activeSection === "sell" && <SellCropSection />}
            {activeSection === "voice" && <VoiceSection isListening={isListening} transcript={transcript} response={response} startListening={startListening} />}
            {activeSection === "inventory" && <InventorySection listings={myListings} />}
            {activeSection === "wallet" && <WalletSection />}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

function OverviewSection({ listings }: { listings: any[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-md)" }}>
          {[
            { icon: PlusCircle, label: "Create Listing", desc: "Register a new crop batch", href: "/farmer?section=sell", color: "#2D5A3F" },
            { icon: Mic, label: "Voice Command", desc: "Speak to control the app", href: "/farmer?section=voice", color: "#CCFF00" },
            { icon: Package, label: "View Inventory", desc: "Check your active listings", href: "/farmer?section=inventory", color: "#00C853" },
            { icon: Phone, label: "Join Call", desc: "Connect with a buyer", href: "/call/demo", color: "#E25C3D" }
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="card card-interactive"
              data-voice={`${action.label.toLowerCase()} ${action.desc.toLowerCase()}`}
              style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-md)" }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "var(--radius-md)",
                background: action.color === "#CCFF00" ? action.color : `${action.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <action.icon size={22} color={action.color === "#CCFF00" ? "#111812" : action.color} />
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{action.label}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{action.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Recent Activity</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {[
            { icon: CheckCircle2, text: "Tomato batch verified", time: "2 hours ago", color: "var(--accent-success)" },
            { icon: Package, text: "New listing created", time: "5 hours ago", color: "var(--brand-primary)" },
            { icon: Phone, text: "Video call completed", time: "1 day ago", color: "#6B7B71" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-md)", padding: "var(--space-sm) 0", borderBottom: i < 2 ? "1px solid rgba(26,46,32,0.06)" : "none" }}>
              <item.icon size={18} color={item.color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.9375rem" }}>{item.text}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SellCropSection() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Register New Crop</h3>
        <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
          <div className="input-group">
            <label className="input-label">Crop Type</label>
            <select className="input select" data-testid="input-crop" data-voice="select crop choose crop filter crop" aria-label="crop type">
              <option value="">Select crop</option>
              <option value="tomato">Tomato</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="onion">Onion</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Quantity (kg)</label>
            <input type="number" className="input" placeholder="e.g., 500" data-testid="input-quantity" name="quantity" aria-label="listing quantity" />
          </div>

          <div className="input-group">
            <label className="input-label">Price per kg (₹)</label>
            <input type="number" className="input" placeholder="e.g., 35" data-testid="input-price" name="price" aria-label="price per kg" />
          </div>

          <div className="input-group">
            <label className="input-label">Location</label>
            <input type="text" className="input" placeholder="e.g., Bangalore Rural" data-testid="input-location" name="location" aria-label="farm location" />
          </div>

          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="input-label">Description</label>
            <textarea className="input" placeholder="Describe your crop quality..." data-testid="input-description" name="crop-description" aria-label="crop description" />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "var(--space-md)" }}>
            <button type="button" className="btn btn-primary" data-testid="submit-listing" data-voice="create listing submit listing register crop add crop listing">
              <PlusCircle size={18} />
              Create Listing
            </button>
          </div>
        </form>
      </div>

      <div className="card card-lg surface-muted">
        <div className="badge badge-blockchain" style={{ marginBottom: "var(--space-lg)" }}>AI Powered</div>
        <h3 style={{ marginBottom: "var(--space-md)" }}>Price Suggestion</h3>
        <p style={{ marginBottom: "var(--space-lg)" }}>Based on current market trends.</p>
        
        <div style={{ padding: "var(--space-lg)", background: "var(--bg-surface)", borderRadius: "var(--radius-md)" }}>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "var(--space-xs)" }}>
            Suggested Price Range
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, fontFamily: "Outfit, sans-serif", color: "var(--brand-primary)" }}>
            ₹32 - ₹38/kg
          </div>
        </div>
      </div>
    </div>
  );
}

function VoiceSection({ isListening, transcript, response, startListening }: any) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
      <div className="card card-lg" style={{ textAlign: "center" }}>
        <h3 style={{ marginBottom: "var(--space-xl)" }}>Voice Assistant</h3>
        
        <motion.button
          className={`voice-fab ${isListening ? "listening" : ""}`}
          style={{ 
            position: "relative", 
            margin: "0 auto var(--space-xl)",
            width: 120,
            height: 120
          }}
          onClick={startListening}
          whileTap={{ scale: 0.95 }}
          data-testid="voice-main-btn"
          data-voice="start voice command voice help start listening"
        >
          <Mic size={48} />
        </motion.button>

        <p style={{ marginBottom: "var(--space-lg)", color: "var(--text-secondary)" }}>
          {isListening ? "Listening... Speak now" : "Tap to start speaking"}
        </p>

        {transcript && (
          <div style={{ 
            padding: "var(--space-lg)", 
            background: "var(--bg-secondary)", 
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-lg)",
            textAlign: "left"
          }}>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "var(--space-xs)" }}>You said:</div>
            <div style={{ fontWeight: 500 }}>{transcript}</div>
          </div>
        )}

        {response && (
          <div style={{ 
            padding: "var(--space-lg)", 
            background: "rgba(45, 90, 63, 0.08)", 
            borderRadius: "var(--radius-md)",
            textAlign: "left",
            borderLeft: "4px solid var(--brand-primary)"
          }}>
            <div style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "var(--space-xs)" }}>Response:</div>
            <div>{response}</div>
          </div>
        )}
      </div>

      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Voice Commands</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {[
            { cmd: "sell tomato 200 kilos", desc: "Create a new listing" },
            { cmd: "check price", desc: "Get current market prices" },
            { cmd: "go to inventory", desc: "View your listings" },
            { cmd: "connect wallet", desc: "Open wallet settings" },
            { cmd: "help", desc: "See all commands" }
          ].map(item => (
            <div 
              key={item.cmd}
              style={{ 
                padding: "var(--space-md)", 
                background: "var(--bg-secondary)", 
                borderRadius: "var(--radius-md)" 
              }}
            >
              <div style={{ 
                fontFamily: "JetBrains Mono, monospace", 
                fontSize: "0.875rem",
                color: "var(--brand-primary)",
                marginBottom: 2
              }}>
                "{item.cmd}"
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InventorySection({ listings }: { listings: any[] }) {
  return (
    <div className="card card-lg">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
        <h3>My Inventory</h3>
        <Link href="/farmer?section=sell" className="btn btn-primary btn-sm" data-voice="add new create listing register crop">
          <PlusCircle size={16} />
          Add New
        </Link>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {listings.map((listing, index) => (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="surface"
            style={{ 
              display: "grid", 
              gridTemplateColumns: "100px 1fr auto",
              gap: "var(--space-lg)",
              padding: "var(--space-md)",
              borderRadius: "var(--radius-lg)"
            }}
          >
            <div style={{ 
              width: 100, 
              height: 80, 
              borderRadius: "var(--radius-md)", 
              overflow: "hidden",
              background: "var(--bg-secondary)"
            }}>
              <img 
                src={listing.images?.[0] || "https://images.unsplash.com/photo-1762414103968-0e1c31b1aaca?w=200"} 
                alt={listing.crop}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: "var(--space-xs)" }}>
                <h4 style={{ margin: 0 }}>{listing.crop}</h4>
                <span className={`badge ${listing.status === "VERIFIED" ? "badge-success" : ""}`}>
                  {listing.status?.replace("_", " ")}
                </span>
              </div>
              <div style={{ display: "flex", gap: "var(--space-lg)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={14} /> {listing.location}
                </span>
                <span>{listing.quantityKg} kg</span>
                <span style={{ fontWeight: 600, color: "var(--brand-primary)" }}>₹{listing.pricePerKg}/kg</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-sm)" }}>
              <Link href={`/listing/${listing.id}`} className="btn btn-secondary btn-sm" data-voice={`view ${listing.crop.toLowerCase()} listing open ${listing.crop.toLowerCase()} details`}>
                View
              </Link>
              <Link href={`/call/${listing.liveRoomId || `room-${listing.id}`}`} className="btn btn-primary btn-sm" data-voice={`open video room join call verify ${listing.crop.toLowerCase()} call buyer connect buyer video call`}>
                <Phone size={14} />
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WalletSection() {
  const [isConnected, setIsConnected] = useState(false);

  const connectWallet = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });
        setIsConnected(true);
      } catch (err) {
        console.error(err);
      }
    } else {
      alert("Please install MetaMask.");
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xl)" }}>
      <div className="wallet-card">
        <div className="wallet-header">
          <div>
            <div className="wallet-balance-label">Available Balance</div>
            <div className="wallet-balance">0.00 ETH</div>
          </div>
          <div className="badge badge-blockchain">Polygon</div>
        </div>
        
        {!isConnected ? (
          <button 
            className="btn btn-accent" 
            style={{ width: "100%" }}
            onClick={connectWallet}
            data-testid="connect-wallet-btn"
            data-voice="connect wallet open metamask wallet login wallet"
          >
            <Wallet size={18} />
            Connect MetaMask
          </button>
        ) : (
          <div>
            <div className="wallet-address" style={{ fontFamily: "JetBrains Mono", fontSize: "0.875rem", opacity: 0.7 }}>
              0x742d...3f4a
            </div>
            <span className="badge badge-success" style={{ marginTop: "var(--space-md)" }}>Connected</span>
          </div>
        )}
      </div>

      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>How Escrow Works</h3>
        <div className="timeline">
          {[
            { title: "Buyer Initiates", desc: "Payment locked in smart contract" },
            { title: "Verification", desc: "Video call confirms quality" },
            { title: "Delivery", desc: "Farmer ships produce" },
            { title: "Release", desc: "Payment released to farmer" }
          ].map((step, i) => (
            <div key={i} className="timeline-item">
              <div className="timeline-marker">
                <div className="timeline-dot" />
                <div className="timeline-line" />
              </div>
              <div className="timeline-content">
                <div className="timeline-title">{step.title}</div>
                <div className="timeline-description">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
