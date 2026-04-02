"use client";

import { useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Video,
  ArrowRight,
  ArrowLeft,
  Leaf,
  CheckCircle2,
  Grid3X3,
  List
} from "lucide-react";
import { getListings } from "@/lib/data/mock-db";
import { Listing } from "@/lib/types";
import { BrandMark } from "@/components/branding/BrandMark";

const filters = {
  crops: ["All", "Tomato", "Rice", "Wheat", "Onion", "Potato"],
  sort: ["Recommended", "Price: Low to High", "Price: High to Low", "Highest Trust"]
};

export default function BuyerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [listings, setListings] = useState<Listing[]>(() => getListings());

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
          setListings(data);
        }
      } catch {
        // Keep bundled fallback data if the API is unavailable.
      }
    }

    void loadListings();

    return () => {
      isMounted = false;
    };
  }, []);
  
  const filteredListings = listings.filter(listing => {
    if (selectedCrop !== "All" && listing.crop !== selectedCrop) return false;
    if (searchQuery && !listing.crop.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* Navigation */}
      <header className="nav-header">
        <div className="nav-container">
          <Link href="/" className="nav-brand" data-voice="go home open home page">
            <BrandMark className="nav-logo" style={{ background: "#CCFF00", color: "#111812" }} />
            <div>
              <div className="nav-title">Buyer Marketplace</div>
              <div className="nav-subtitle">Source with Trust</div>
            </div>
          </Link>

          <nav className="nav-links">
            <Link href="/buyer" className="nav-link active" data-voice="open buyer page buyer marketplace">
              Marketplace
            </Link>
            <Link href="/farmer" className="nav-link" data-voice="open farmer page farmer dashboard">
              Farmer View
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "var(--space-xl)" }}
        >
          <h1 className="dashboard-title">Find Fresh Produce</h1>
          <p className="dashboard-subtitle">
            Browse verified crops from trusted farmers with AI-graded quality and blockchain traceability.
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
          style={{ marginBottom: "var(--space-xl)" }}
        >
          <div style={{ display: "flex", gap: "var(--space-lg)", flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* Search */}
            <div className="input-group" style={{ flex: "1 1 300px" }}>
              <label className="input-label">Search Crops</label>
              <div style={{ position: "relative" }}>
                <Search 
                  size={18} 
                  style={{ 
                    position: "absolute", 
                    left: 16, 
                    top: "50%", 
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }} 
                />
                <input
                  type="text"
                  className="input"
                  placeholder="Search for tomato, rice, wheat..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 48 }}
                  data-testid="search-input"
                  name="search"
                  id="buyer-search"
                  aria-label="search crops"
                />
              </div>
            </div>

            {/* Crop Filter */}
            <div className="input-group" style={{ flex: "0 1 180px" }}>
              <label className="input-label">Crop Type</label>
              <select 
                className="input select"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}
                data-testid="filter-crop"
                data-voice="select crop choose crop filter crop"
                aria-label="crop filter"
              >
                {filters.crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="input-group" style={{ flex: "0 1 180px" }}>
              <label className="input-label">Sort By</label>
              <select className="input select" data-testid="filter-sort" data-voice="sort results choose sort filter sort" aria-label="sort results">
                {filters.sort.map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div style={{ display: "flex", gap: "var(--space-xs)", paddingBottom: 4 }}>
              <button 
                className={`btn btn-icon ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setViewMode("grid")}
                data-voice="grid view card view"
              >
                <Grid3X3 size={18} />
              </button>
              <button 
                className={`btn btn-icon ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setViewMode("list")}
                data-voice="list view row view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: "var(--space-lg)"
        }}>
          <p style={{ margin: 0 }}>
            <strong>{filteredListings.length}</strong> listings found
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>All verified by AI</span>
          </div>
        </div>

        {/* Listings Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(340px, 1fr))" : "1fr",
          gap: "var(--space-lg)"
        }}>
          {filteredListings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard listing={listing} viewMode={viewMode} />
            </motion.div>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="card" style={{ textAlign: "center", padding: "var(--space-3xl)" }}>
            <Leaf size={48} color="var(--text-muted)" style={{ margin: "0 auto var(--space-lg)" }} />
            <h3>No listings found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ProductCard({ listing, viewMode }: { listing: any; viewMode: "grid" | "list" }) {
  const router = useRouter();
  const listingHref = `/listing/${listing.id}`;
  const roomHref = `/call/${listing.liveRoomId || `room-${listing.id}`}`;

  const openListing = () => {
    router.push(listingHref);
  };

  const openListingFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openListing();
    }
  };

  const stopCardClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      data-testid={`listing-${listing.id}`}
      data-voice={`view ${listing.crop.toLowerCase()} listing open ${listing.crop.toLowerCase()} details view details`}
      role="button"
      tabIndex={0}
      onClick={openListing}
      onKeyDown={openListingFromKeyboard}
    >
      <div className="product-card" style={viewMode === "list" ? { flexDirection: "row", cursor: "pointer" } : { cursor: "pointer" }}>
        {viewMode === "list" && (
          <div style={{ width: 200, flexShrink: 0 }}>
            <div className="product-image" style={{ aspectRatio: "4/3" }}>
              <img 
                src={listing.images?.[0] || "https://images.unsplash.com/photo-1762414103968-0e1c31b1aaca?w=400"} 
                alt={listing.crop}
              />
            </div>
          </div>
        )}
        
        {viewMode === "grid" && (
          <div className="product-image">
            <img 
              src={listing.images?.[0] || "https://images.unsplash.com/photo-1762414103968-0e1c31b1aaca?w=400"} 
              alt={listing.crop}
            />
            <div className="product-badges">
              <span className="badge badge-success">Grade {listing.qualityGrade}</span>
              <span className="badge badge-blockchain">
                <CheckCircle2 size={12} /> Verified
              </span>
            </div>
          </div>
        )}
        
        <div className="product-content" style={viewMode === "list" ? { flex: 1 } : undefined}>
          <div className="product-header">
            <div className="product-title">{listing.crop}</div>
            <div className="product-price">₹{listing.pricePerKg}/kg</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            <MapPin size={14} /> {listing.location}
          </div>

          {viewMode === "grid" && (
            <div className="product-meta">
              <div className="product-meta-item">
                <div className="product-meta-value">{listing.quantityKg} kg</div>
                <div className="product-meta-label">Available</div>
              </div>
              <div className="product-meta-item">
                <div className="product-meta-value">{listing.farmer?.trustScore || 92}%</div>
                <div className="product-meta-label">Trust</div>
              </div>
              <div className="product-meta-item">
                <div className="product-meta-value" style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Star size={12} fill="currentColor" /> {listing.qualityGrade}
                </div>
                <div className="product-meta-label">Quality</div>
              </div>
            </div>
          )}

          {viewMode === "list" && (
            <div style={{ display: "flex", gap: "var(--space-md)", flexWrap: "wrap", marginTop: "var(--space-sm)" }}>
              <span className="badge badge-success">Grade {listing.qualityGrade}</span>
              <span className="badge">Trust: {listing.farmer?.trustScore || 92}%</span>
              <span className="badge">{listing.quantityKg} kg</span>
            </div>
          )}

          <div className="product-actions">
            <Link
              href={roomHref}
              className="btn btn-secondary"
              style={{ flex: 1 }}
              data-voice={`verify ${listing.crop.toLowerCase()} open video room verify live video call call buyer connect buyer`}
              onClick={stopCardClick}
            >
              <Video size={16} /> Verify
            </Link>
            <Link
              href={listingHref}
              className="btn btn-primary"
              style={{ flex: 1 }}
              data-voice={`view ${listing.crop.toLowerCase()} details open listing detail page`}
              onClick={stopCardClick}
            >
              Details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
