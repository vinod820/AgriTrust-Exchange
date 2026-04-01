"use client";

import { useDeferredValue, useState } from "react";
import { ListingCard } from "@/components/marketplace/ListingCard";
import { WalletPanel } from "@/components/ui/WalletPanel";
import { Listing } from "@/lib/types";

type SortOption = "recommended" | "price_low" | "price_high" | "trust";

export function BuyerMarketplace({ listings }: { listings: Listing[] }) {
  const [query, setQuery] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const deferredQuery = useDeferredValue(query);

  const normalizedQuery = deferredQuery.trim().toLowerCase();

  const filteredListings = listings
    .filter((listing) => {
      const searchable = `${listing.crop} ${listing.location} ${listing.farmerName}`.toLowerCase();
      const matchesQuery = normalizedQuery.length === 0 || searchable.includes(normalizedQuery);
      const matchesVerified = !verifiedOnly || listing.verified;
      return matchesQuery && matchesVerified;
    })
    .sort((left, right) => {
      if (sortBy === "price_low") {
        return left.pricePerKg - right.pricePerKg;
      }

      if (sortBy === "price_high") {
        return right.pricePerKg - left.pricePerKg;
      }

      if (sortBy === "trust") {
        return right.trustScore - left.trustScore;
      }

      return Number(right.verified) - Number(left.verified) || right.trustScore - left.trustScore;
    });

  return (
    <section className="buyer-marketplace-grid">
      <aside className="card filter-panel">
        <div className="panel-title-row">
          <div>
            <p className="kicker">Discover produce</p>
            <h3>Find the right lot quickly</h3>
          </div>
        </div>

        <label className="field">
          Search by crop, location, or farmer
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tomato, Nashik, Meera Farms"
          />
        </label>

        <label className="field">
          Sort results
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)}>
            <option value="recommended">Recommended</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
            <option value="trust">Highest trust score</option>
          </select>
        </label>

        <label className="toggle-row">
          <input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} />
          <span>Show verified lots only</span>
        </label>

        <div className="asset-chip-row">
          <span className="asset-chip">Live video verification</span>
          <span className="asset-chip">AI quality grade</span>
          <span className="asset-chip">Escrow-ready flow</span>
        </div>
      </aside>

      <div className="buyer-results">
        <section className="card results-toolbar">
          <div>
            <p className="kicker">Available listings</p>
            <h3>{filteredListings.length} lots match your view</h3>
          </div>
          <div className="tag-row">
            <span className="tag">{listings.filter((listing) => listing.verified).length} verified</span>
            <span className="tag">{listings.filter((listing) => listing.liveRoomId).length} live-ready</span>
          </div>
        </section>

        <div className="listing-grid">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)
          ) : (
            <div className="empty-state">No listings match the current filters.</div>
          )}
        </div>
      </div>

      <div className="sidebar-stack">
        <section className="card support-card">
          <p className="kicker">Buyer flow</p>
          <h3>How to purchase safely</h3>
          <div className="support-list">
            <div className="support-list-item">
              <strong>1. Compare lots</strong>
              <p>Use the product cards to review quality grade, region, trust score, and pricing.</p>
            </div>
            <div className="support-list-item">
              <strong>2. Verify live</strong>
              <p>Join the video room to confirm the produce visually before committing.</p>
            </div>
            <div className="support-list-item">
              <strong>3. Lock escrow</strong>
              <p>Open the listing detail page and lock payment only after you are satisfied.</p>
            </div>
          </div>
        </section>
        <WalletPanel compact />
      </div>
    </section>
  );
}
