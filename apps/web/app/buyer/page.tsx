import { RoleShell } from "@/components/dashboard/RoleShell";
import { BuyerMarketplace } from "@/components/marketplace/BuyerMarketplace";
import { getListings } from "@/lib/data/mock-db";

export default function BuyerPage() {
  const listings = getListings();
  const verified = listings.filter((listing) => listing.verified).length;

  return (
    <RoleShell
      role="Buyer"
      title="Buy from a marketplace that looks and feels trustworthy."
      description="Each listing now focuses on what matters most to a buyer: product image, crop, price, quality, trust score, origin, and the next action."
    >
      <section className="metrics-row">
        <article className="card metric-card">
          <span>Available batches</span>
          <strong>{listings.length}</strong>
        </article>
        <article className="card metric-card">
          <span>Verified lots</span>
          <strong>{verified}</strong>
        </article>
        <article className="card metric-card">
          <span>Live verification</span>
          <strong>{listings.filter((listing) => listing.liveRoomId).length}</strong>
        </article>
        <article className="card metric-card">
          <span>Typical grade</span>
          <strong>A to B</strong>
        </article>
      </section>

      <BuyerMarketplace listings={listings} />
    </RoleShell>
  );
}
