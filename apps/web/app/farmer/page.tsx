"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrowserProvider, formatEther } from "ethers";
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
import { ensureWalletOnAmoy, formatWalletAddress, publishBatchOnChain, resolveListingPublishFailure } from "@/lib/contracts/client";
import { contracts } from "@/lib/contracts/config";
import { isBlockchainConfigured } from "@/lib/contracts/config";
import { getProductImageForCrop } from "@/lib/data/product-images";
import { getListings } from "@/lib/data/mock-db";
import { createListingSchema, getListingFieldErrors, getListingValidationMessage, type ListingFieldErrors } from "@/lib/listings/validation";
import { CreateListingInput, Listing } from "@/lib/types";
import { getInjectedProvider, getWalletErrorMessage, waitForInjectedProvider } from "@/lib/wallet/provider";
import { BrandMark } from "@/components/branding/BrandMark";
import { useVoice } from "@/components/voice/VoiceProvider";

const sections = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "sell", label: "Sell Crop", icon: PlusCircle },
  { id: "voice", label: "Voice", icon: Mic },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "wallet", label: "Wallet", icon: Wallet }
];

const initialSellCropForm = {
  crop: "",
  quantityKg: "",
  pricePerKg: "",
  location: "",
  description: ""
};

function buildBatchId(crop: string, onChainBatchId?: number) {
  const prefix = crop
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3) || "LOT";

  return `BATCH-${prefix}-${onChainBatchId ?? Math.floor(Math.random() * 9000 + 1000)}`;
}

function todayDateValue() {
  return new Date().toISOString().slice(0, 10);
}

export default function FarmerPage() {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") || "overview";
  const { isListening, transcript, response, startListening, stopListening } = useVoice();
  const [myListings, setMyListings] = useState<Listing[]>(() => getListings().slice(0, 3));

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      try {
        const response = await fetch("/api/listings", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Listing[];
        if (isMounted) {
          setMyListings(data.slice(0, 3));
        }
      } catch {
        // Keep local fallback data if the API is unavailable.
      }
    }

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalKg = myListings.reduce((sum, l) => sum + l.quantityKg, 0);
  const earnings = myListings.reduce((sum, l) => sum + (l.quantityKg * l.pricePerKg * 0.3), 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Navigation */}
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-testid="nav-brand">
            <BrandMark className="nav-logo" background="var(--brand-primary)" color="var(--brand-secondary)" />
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
            {activeSection === "sell" && (
              <SellCropSection
                onCreated={(listing) => {
                  setMyListings((current) => [listing, ...current.filter((item) => item.id !== listing.id)].slice(0, 3));
                }}
              />
            )}
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

function SellCropSection({ onCreated }: { onCreated: (listing: Listing) => void }) {
  const router = useRouter();
  const [form, setForm] = useState(initialSellCropForm);
  const [fieldErrors, setFieldErrors] = useState<ListingFieldErrors>({});
  const [status, setStatus] = useState("Ready to publish a new batch.");
  const [explorerHref, setExplorerHref] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof initialSellCropForm>(key: K, value: (typeof initialSellCropForm)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key as keyof ListingFieldErrors]) {
        return current;
      }

      return {
        ...current,
        [key]: undefined
      };
    });
  }

  function renderFieldError(key: keyof ListingFieldErrors) {
    if (!fieldErrors[key]) {
      return null;
    }

    return (
      <span style={{ marginTop: 4, fontSize: "0.8125rem", color: "var(--accent-warning)" }}>
        {fieldErrors[key]}
      </span>
    );
  }

  async function submitListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const crop = form.crop.trim();
    const location = form.location.trim();
    const quantityKg = Number(form.quantityKg);
    const pricePerKg = Number(form.pricePerKg);
    const imageReference = getProductImageForCrop(crop || "produce");

    let payload: CreateListingInput = {
      crop,
      farmerName: "Voice Farmer Demo",
      farmerWallet: "0xFA11...0011",
      location,
      quantityKg,
      pricePerKg,
      harvestDate: todayDateValue(),
      description: form.description.trim(),
      images: [imageReference],
      geoLabel: location
    };

    const validation = createListingSchema.safeParse(payload);
    if (!validation.success) {
      setExplorerHref("");
      setFieldErrors(getListingFieldErrors(validation.error));
      setStatus(getListingValidationMessage(validation.error));
      return;
    }

    setIsSubmitting(true);
    setExplorerHref("");

    try {
      setFieldErrors({});
      if (isBlockchainConfigured()) {
        setStatus("Opening MetaMask and connecting to Polygon Amoy...");
        try {
          const onChainResult = await publishBatchOnChain({
            cropType: crop,
            quantityKg,
            imageReference,
            geoLabel: location,
            pricePerKg,
            onProgress: (message) => setStatus(message)
          });

          payload = {
            ...payload,
            batchId: buildBatchId(crop, onChainResult.batchId),
            farmerName: `Farmer ${formatWalletAddress(onChainResult.farmerAddress)}`,
            farmerWallet: onChainResult.farmerAddress,
            onChainBatchId: onChainResult.batchId,
            onChainTxHash: onChainResult.transactionHash
          };
        } catch (error) {
          setStatus(resolveListingPublishFailure(error).message);
          return;
        }
      } else {
        setStatus("Blockchain is not configured for Polygon Amoy right now.");
        return;
      }

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const body = await response.json();

      if (response.ok) {
        const txHash = body.onChainTxHash ?? payload.onChainTxHash;
        setForm(initialSellCropForm);
        onCreated(body as Listing);
        setStatus(`Batch ${body.batchId} is live on-chain as #${body.onChainBatchId}.`);
        setExplorerHref(txHash ? `${contracts.amoyExplorerUrl}/tx/${txHash}` : "");
        router.refresh();
        return;
      }

      if (body.fieldErrors) {
        setFieldErrors(body.fieldErrors as ListingFieldErrors);
      }
      setStatus(body.error ?? "Listing submission failed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Listing submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-xl)" }}>
      <div className="card card-lg">
        <h3 style={{ marginBottom: "var(--space-lg)" }}>Register New Crop</h3>
        <form onSubmit={submitListing} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-lg)" }}>
          <div className="input-group">
            <label className="input-label">Crop Type</label>
            <select
              className="input select"
              value={form.crop}
              onChange={(event) => updateField("crop", event.target.value)}
              data-testid="input-crop"
              data-voice="select crop choose crop filter crop"
              aria-label="crop type"
              required
            >
              <option value="">Select crop</option>
              <option value="tomato">Tomato</option>
              <option value="rice">Rice</option>
              <option value="wheat">Wheat</option>
              <option value="onion">Onion</option>
            </select>
            {renderFieldError("crop")}
          </div>

          <div className="input-group">
            <label className="input-label">Quantity (kg)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g., 500"
              value={form.quantityKg}
              onChange={(event) => updateField("quantityKg", event.target.value)}
              data-testid="input-quantity"
              name="quantity"
              aria-label="listing quantity"
              min="1"
              required
            />
            {renderFieldError("quantityKg")}
          </div>

          <div className="input-group">
            <label className="input-label">Price per kg (₹)</label>
            <input
              type="number"
              className="input"
              placeholder="e.g., 35"
              value={form.pricePerKg}
              onChange={(event) => updateField("pricePerKg", event.target.value)}
              data-testid="input-price"
              name="price"
              aria-label="price per kg"
              min="1"
              required
            />
            {renderFieldError("pricePerKg")}
          </div>

          <div className="input-group">
            <label className="input-label">Location</label>
            <input
              type="text"
              className="input"
              placeholder="e.g., Bangalore Rural"
              value={form.location}
              onChange={(event) => updateField("location", event.target.value)}
              data-testid="input-location"
              name="location"
              aria-label="farm location"
              minLength={2}
              required
            />
            {renderFieldError("location")}
          </div>

          <div className="input-group" style={{ gridColumn: "1 / -1" }}>
            <label className="input-label">Description</label>
            <textarea
              className="input"
              placeholder="Describe your crop quality..."
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              data-testid="input-description"
              name="crop-description"
              aria-label="crop description"
              minLength={8}
              required
            />
            {renderFieldError("description")}
          </div>

          <div style={{ gridColumn: "1 / -1", display: "flex", gap: "var(--space-md)" }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              data-testid="submit-listing"
              data-voice="create listing submit listing register crop add crop listing"
            >
              <PlusCircle size={18} />
              {isSubmitting ? "Creating..." : "Create Listing"}
            </button>
          </div>
          <p style={{ gridColumn: "1 / -1", margin: 0, color: "var(--text-secondary)" }}>{status}</p>
          {explorerHref ? (
            <a
              href={explorerHref}
              target="_blank"
              rel="noreferrer"
              style={{
                gridColumn: "1 / -1",
                color: "var(--brand-primary)",
                fontWeight: 600,
                textDecoration: "underline"
              }}
            >
              View this Polygon Amoy transaction on Polygonscan
            </a>
          ) : null}
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
  const [wallet, setWallet] = useState({
    hasProvider: null as boolean | null,
    account: "",
    balance: "",
    chainId: "",
    statusText: "Checking for MetaMask..."
  });
  const [connecting, setConnecting] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    let active = true;
    let boundProvider = getInjectedProvider();

    async function refreshWallet(providerOverride?: ReturnType<typeof getInjectedProvider>) {
      const providerSource = providerOverride ?? getInjectedProvider();

      if (!providerSource) {
        if (!active) {
          return;
        }

        setWallet({
          hasProvider: false,
          account: "",
          balance: "",
          chainId: "",
          statusText: "MetaMask is not available in this browser yet."
        });
        return;
      }

      const browserProvider = new BrowserProvider(providerSource as never);
      const accounts = (await providerSource.request({ method: "eth_accounts" })) as string[];
      const network = await browserProvider.getNetwork();
      const chainId = network.chainId.toString();
      const isAmoy = chainId === String(contracts.chainId);

      if (!active) {
        return;
      }

      if (accounts[0]) {
        const balance = await browserProvider.getBalance(accounts[0]);

        if (!active) {
          return;
        }

        setWallet({
          hasProvider: true,
          account: accounts[0],
          balance: `${Number(formatEther(balance)).toFixed(4)} ETH`,
          chainId,
          statusText: isAmoy
            ? "Wallet connected and ready for blockchain actions."
            : `Wallet connected on chain ${chainId}. Connect once more to switch to Polygon Amoy.`
        });
        return;
      }

      setWallet({
        hasProvider: true,
        account: "",
        balance: "",
        chainId,
        statusText: isAmoy
          ? "MetaMask detected. Connect to start blockchain-backed actions."
          : `MetaMask detected on chain ${chainId}. Connect to switch to Polygon Amoy.`
      });
    }

    function handleWalletChange() {
      void refreshWallet(boundProvider);
    }

    async function detectWallet() {
      const provider = await waitForInjectedProvider();
      if (!active) {
        return;
      }

      boundProvider = provider;
      provider?.on?.("accountsChanged", handleWalletChange);
      provider?.on?.("chainChanged", handleWalletChange);
      await refreshWallet(provider);
    }

    void detectWallet();

    return () => {
      active = false;
      boundProvider?.removeListener?.("accountsChanged", handleWalletChange);
      boundProvider?.removeListener?.("chainChanged", handleWalletChange);
    };
  }, []);

  async function connectWallet() {
    setErrorText("");
    const provider = await waitForInjectedProvider(1800);

    if (!provider) {
      setWallet({
        hasProvider: false,
        account: "",
        balance: "",
        chainId: "",
        statusText: "MetaMask is not available in this browser. Install or enable the extension first."
      });
      return;
    }

    setConnecting(true);
    try {
      const browserProvider = await ensureWalletOnAmoy();
      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();
      const [balance, network] = await Promise.all([
        browserProvider.getBalance(address),
        browserProvider.getNetwork()
      ]);

      setWallet({
        hasProvider: true,
        account: address,
        balance: `${Number(formatEther(balance)).toFixed(4)} ETH`,
        chainId: network.chainId.toString(),
        statusText: "Wallet connected successfully on Polygon Amoy."
      });
    } catch (error) {
      setErrorText(getWalletErrorMessage(error));
      setWallet((current) => ({
        ...current,
        hasProvider: current.hasProvider ?? true,
        statusText: "Wallet connection did not finish."
      }));
    } finally {
      setConnecting(false);
    }
  }

  async function refreshWallet() {
    setErrorText("");
    const provider = await waitForInjectedProvider(1800);

    if (!provider) {
      setWallet({
        hasProvider: false,
        account: "",
        balance: "",
        chainId: "",
        statusText: "MetaMask is still not available. Use Chrome, Edge, or Brave with the extension enabled."
      });
      return;
    }

    const browserProvider = new BrowserProvider(provider as never);
    const accounts = (await provider.request({ method: "eth_accounts" })) as string[];
    const network = await browserProvider.getNetwork();
    const chainId = network.chainId.toString();

    if (accounts[0]) {
      const balance = await browserProvider.getBalance(accounts[0]);
      setWallet({
        hasProvider: true,
        account: accounts[0],
        balance: `${Number(formatEther(balance)).toFixed(4)} ETH`,
        chainId,
        statusText:
          chainId === String(contracts.chainId)
            ? "Wallet refreshed and ready."
            : `Wallet refreshed on chain ${chainId}. Connect once more to switch to Polygon Amoy.`
      });
      return;
    }

    setWallet({
      hasProvider: true,
      account: "",
      balance: "",
      chainId,
      statusText:
        chainId === String(contracts.chainId)
          ? "MetaMask detected. Connect to continue."
          : `MetaMask detected on chain ${chainId}. Connect to switch to Polygon Amoy.`
    });
  }

  const walletBadge =
    wallet.chainId === String(contracts.chainId) ? "Polygon Amoy" : wallet.chainId ? `Chain ${wallet.chainId}` : "Polygon";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-xl)" }}>
      <div className="wallet-card">
        <div className="wallet-header">
          <div>
            <div className="wallet-balance-label">Available Balance</div>
            <div className="wallet-balance">{wallet.balance || "0.0000 ETH"}</div>
          </div>
          <div className="badge badge-blockchain">{walletBadge}</div>
        </div>

        <div
          style={{
            padding: "var(--space-md)",
            background: "rgba(26, 46, 32, 0.04)",
            borderRadius: "var(--radius-md)",
            marginBottom: "var(--space-md)"
          }}
        >
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Wallet status</div>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>{errorText || wallet.statusText}</p>
        </div>

        {wallet.account ? (
          <div>
            <div className="wallet-address" style={{ fontFamily: "JetBrains Mono", fontSize: "0.875rem", opacity: 0.7 }}>
              {formatWalletAddress(wallet.account)}
            </div>
            <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap", marginTop: "var(--space-md)" }}>
              <span className="badge badge-success">Connected</span>
              <button className="btn btn-secondary btn-sm" onClick={refreshWallet}>
                Refresh Wallet
              </button>
            </div>
          </div>
        ) : wallet.hasProvider === false ? (
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={refreshWallet}>
              Retry Detection
            </button>
            <a className="btn btn-accent" href="https://metamask.io/download/" target="_blank" rel="noreferrer">
              Install MetaMask
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            <button
              className="btn btn-accent"
              style={{ flex: 1, minWidth: 220 }}
              onClick={connectWallet}
              disabled={connecting}
              data-testid="connect-wallet-btn"
              data-voice="connect wallet open metamask wallet login wallet"
            >
              <Wallet size={18} />
              {connecting ? "Connecting..." : "Connect MetaMask"}
            </button>
            <button className="btn btn-secondary" onClick={refreshWallet}>
              Refresh Wallet
            </button>
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
