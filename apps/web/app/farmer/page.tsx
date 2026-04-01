"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Package,
  Wallet,
  TrendingUp,
  PlusCircle,
  ChevronRight,
  Leaf,
  BarChart3,
  Phone,
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X,
  Volume2
} from "lucide-react";
import { getListings } from "@/lib/data/mock-db";

const sections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "sell", label: "Sell Crop", icon: PlusCircle },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "wallet", label: "Wallet", icon: Wallet }
];

const VOICE_COMMANDS: Record<string, { action: string; route?: string; response: string }> = {
  "hello": { action: "greet", response: "Hello! Welcome to KrishiVoice Chain. How can I help you today?" },
  "hi": { action: "greet", response: "Hi there! Ready to help you with your farming needs." },
  "go to buyer": { action: "navigate", route: "/buyer", response: "Opening the Buyer Marketplace." },
  "open marketplace": { action: "navigate", route: "/buyer", response: "Opening the Buyer Marketplace." },
  "sell crop": { action: "navigate", route: "/farmer?section=sell", response: "Opening crop registration." },
  "check inventory": { action: "navigate", route: "/farmer?section=inventory", response: "Opening your inventory." },
  "connect wallet": { action: "navigate", route: "/farmer?section=wallet", response: "Opening wallet connection." },
  "check price": { action: "price", response: "Current prices: Tomato Rs35/kg, Rice Rs42/kg, Wheat Rs28/kg." },
  "help": { action: "help", response: "Say: sell crop, check price, go to buyer market, check inventory." },
};

export default function FarmerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "overview";
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  
  const myListings = getListings().slice(0, 3);
  const totalKg = myListings.reduce((sum, l) => sum + l.quantityKg, 0);
  const earnings = myListings.reduce((sum, l) => sum + (l.quantityKg * l.pricePerKg * 0.3), 0);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const processCommand = useCallback((text: string) => {
    let matchedCommand = null;
    let matchedKey = "";
    
    for (const key of Object.keys(VOICE_COMMANDS)) {
      if (text.includes(key)) {
        if (!matchedKey || key.length > matchedKey.length) {
          matchedCommand = VOICE_COMMANDS[key];
          matchedKey = key;
        }
      }
    }

    if (matchedCommand) {
      setResponse(matchedCommand.response);
      speak(matchedCommand.response);
      
      if (matchedCommand.route) {
        setTimeout(() => router.push(matchedCommand.route!), 1000);
      }
    } else {
      const defaultResponse = `I heard "${text}". Try saying "help" for commands.`;
      setResponse(defaultResponse);
      speak(defaultResponse);
    }
  }, [router, speak]);

  const startListening = useCallback(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript.toLowerCase().trim();
        setTranscript(transcriptText);

        if (event.results[current].isFinal) {
          processCommand(transcriptText);
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      setTranscript("");
      setResponse("");
      setShowVoicePanel(true);
      setIsListening(true);
      recognition.start();
    }
  }, [processCommand]);

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
            <Link href="/farmer" className="nav-link active">Dashboard</Link>
            <Link href="/buyer" className="nav-link">Marketplace</Link>
          </nav>

          <div className="nav-actions">
            <Link href="/" className="btn btn-secondary btn-sm" data-testid="switch-role-btn">
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
              onClick={startListening}
              data-testid="voice-btn-header"
            >
              <Mic size={18} />
              {isListening ? "Listening..." : "Voice Command"}
            </button>
            <Link href="/farmer?section=sell" className="btn btn-primary" data-testid="new-listing-btn">
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

      {/* Voice FAB */}
      <button
        data-testid="voice-fab"
        className={`voice-fab ${isListening ? "listening" : ""}`}
        onClick={startListening}
        aria-label={isListening ? "Stop listening" : "Start voice command"}
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>

      {/* Voice Response Panel */}
      {showVoicePanel && (
        <div className="voice-response fade-in" data-testid="voice-panel">
          <div className="voice-response-header">
            <div className="voice-status">
              {isListening && <span className="voice-status-dot" />}
              <span>{isListening ? "Listening..." : "Voice Assistant"}</span>
            </div>
            <button 
              className="btn-ghost btn-icon"
              onClick={() => setShowVoicePanel(false)}
              style={{ width: 32, height: 32, borderRadius: "var(--radius-sm)" }}
            >
              <X size={18} />
            </button>
          </div>

          {transcript && (
            <div style={{ marginBottom: "var(--space-md)" }}>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>You said:</span>
              <p style={{ margin: "4px 0 0", fontWeight: 500 }}>{transcript}</p>
            </div>
          )}

          {response && (
            <div style={{ 
              padding: "12px", 
              background: "var(--bg-secondary)", 
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-md)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Volume2 size={16} style={{ color: "var(--brand-primary)" }} />
                <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Response:</span>
              </div>
              <p style={{ margin: 0, color: "var(--text-primary)" }}>{response}</p>
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-sm)" }}>
            <span className="badge">sell crop</span>
            <span className="badge">check price</span>
            <span className="badge">open marketplace</span>
          </div>
        </div>
      )}
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
  const [formData, setFormData] = useState({
    crop: "",
    quantity: "",
    price: "",
    location: "",
    description: ""
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Register New Crop</h3>
        <form style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
          <div className="input-group">
            <label className="input-label">Crop Type</label>
            <select className="input select" data-testid="input-crop">
              <option value="">Select crop</option>
              <option value="tomato">Tomato</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="onion">Onion</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Quantity (kg)</label>
            <input type="number" className="input" placeholder="e.g., 500" data-testid="input-quantity" />
          </div>

          <div className="input-group">
            <label className="input-label">Price per kg (₹)</label>
            <input type="number" className="input" placeholder="e.g., 35" data-testid="input-price" />
          </div>

          <div className="input-group">
            <label className="input-label">Location</label>
            <input type="text" className="input" placeholder="e.g., Bangalore Rural" data-testid="input-location" />
          </div>

          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="input-label">Description</label>
            <textarea className="input" placeholder="Describe your crop quality..." data-testid="input-description" />
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "var(--space-md)" }}>
            <button type="button" className="btn btn-primary" data-testid="submit-listing">
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
        <Link href="/farmer?section=sell" className="btn btn-primary btn-sm">
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
              <Link href={`/listing/${listing.id}`} className="btn btn-secondary btn-sm">View</Link>
              <Link href={`/call/${listing.liveRoomId || `room-${listing.id}`}`} className="btn btn-primary btn-sm">
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
