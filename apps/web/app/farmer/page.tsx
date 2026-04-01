import dynamic from "next/dynamic";
import Link from "next/link";
import { RoleShell } from "@/components/dashboard/RoleShell";
import { CreateListingForm } from "@/components/marketplace/CreateListingForm";
import { WalletPanel } from "@/components/ui/WalletPanel";
import { productImageLibrary } from "@/lib/data/product-images";
import { getListings } from "@/lib/data/mock-db";

const FarmerVoiceAssistant = dynamic(
  () => import("@/components/voice/FarmerVoiceAssistant").then((module) => module.FarmerVoiceAssistant),
  {
    ssr: false
  }
);

const farmerSections = [
  {
    id: "overview",
    label: "Overview",
    title: "See what needs attention first",
    description: "A simple summary of your selling flow, open listings, and next actions."
  },
  {
    id: "sell",
    label: "Sell Crop",
    title: "Create a new listing",
    description: "Register a crop lot with the details buyers need to make a decision quickly."
  },
  {
    id: "voice",
    label: "Voice",
    title: "Use the voice assistant",
    description: "Speak simple commands to speed up crop registration and buyer actions."
  },
  {
    id: "inventory",
    label: "Inventory",
    title: "Track your active listings",
    description: "Review your current lots, pricing, and next actions in one place."
  },
  {
    id: "wallet",
    label: "Wallet",
    title: "Connect wallet and payments",
    description: "Get MetaMask ready for escrow-backed buying and selling."
  }
] as const;

type FarmerSectionId = (typeof farmerSections)[number]["id"];

function getActiveSection(sectionParam?: string): FarmerSectionId {
  return farmerSections.find((section) => section.id === sectionParam)?.id ?? "overview";
}

export default function FarmerPage({
  searchParams
}: {
  searchParams?: {
    section?: string;
  };
}) {
  const myListings = getListings().slice(0, 3);
  const totalKg = myListings.reduce((sum, listing) => sum + listing.quantityKg, 0);
  const activeSection = getActiveSection(searchParams?.section);
  const sectionMeta = farmerSections.find((section) => section.id === activeSection) ?? farmerSections[0];

  function renderSection() {
    if (activeSection === "sell") {
      return (
        <div className="workspace-split">
          <CreateListingForm />
          <section className="card support-card">
            <p className="kicker">Selling tips</p>
            <h3>What buyers need to understand quickly</h3>
            <div className="support-list">
              <div className="support-list-item">
                <strong>Keep crop names simple</strong>
                <p>Use names like Tomato, Rice, or Green Chilli instead of internal batch names.</p>
              </div>
              <div className="support-list-item">
                <strong>Use clear quantity and pricing</strong>
                <p>Buyers trust listings more when weight and price are visible without extra clicks.</p>
              </div>
              <div className="support-list-item">
                <strong>Replace the placeholder image later</strong>
                <p>Your local file names are already prepared, so you can swap in real crop photos anytime.</p>
              </div>
            </div>
            <div className="asset-library">
              <p className="kicker">Ready image file names</p>
              <div className="asset-chip-row">
                {productImageLibrary.map((image) => (
                  <span key={image.path} className="asset-chip">
                    {image.path.split("/").pop()}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === "voice") {
      return (
        <div className="workspace-split">
          <FarmerVoiceAssistant />
          <section className="card support-card">
            <p className="kicker">Voice shortcuts</p>
            <h3>Use phrases that are easy to remember</h3>
            <div className="support-list">
              <div className="support-list-item">
                <strong>sell tomato 200 kilos</strong>
                <p>Good for starting a new crop listing quickly.</p>
              </div>
              <div className="support-list-item">
                <strong>call buyer</strong>
                <p>Use it when you want to move directly to live verification.</p>
              </div>
              <div className="support-list-item">
                <strong>check price</strong>
                <p>Good for seeing fair-price direction before you set your number.</p>
              </div>
            </div>
          </section>
        </div>
      );
    }

    if (activeSection === "inventory") {
      return (
        <section className="card">
          <div className="panel-title-row">
            <div>
              <p className="kicker">My listings</p>
              <h3>Recent batch activity</h3>
            </div>
            <Link className="ghost-button" href="/buyer">
              Open buyer market
            </Link>
          </div>
          <div className="inventory-list">
            {myListings.map((listing) => (
              <article key={listing.id} className="inventory-row">
                <div className="inventory-media">
                  <img src={listing.images[0]} alt={`${listing.crop} listing`} />
                </div>
                <div className="inventory-copy">
                  <div className="split-row">
                    <strong>{listing.crop}</strong>
                    <span className="status-pill">{listing.status.replaceAll("_", " ")}</span>
                  </div>
                  <p>{listing.location}</p>
                  <div className="tag-row">
                    <span className="tag">{listing.quantityKg} kg</span>
                    <span className="tag">Rs {listing.pricePerKg}/kg</span>
                    <span className="tag">Grade {listing.qualityGrade}</span>
                  </div>
                </div>
                <div className="inventory-actions">
                  <Link className="ghost-button" href={`/listing/${listing.id}`}>
                    View details
                  </Link>
                  <Link className="ghost-button" href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`}>
                    Join call
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    if (activeSection === "wallet") {
      return (
        <div className="workspace-split">
          <WalletPanel />
          <section className="card support-card">
            <p className="kicker">Payment guide</p>
            <h3>How the wallet fits the seller flow</h3>
            <div className="support-list">
              <div className="support-list-item">
                <strong>1. Connect MetaMask once</strong>
                <p>After the wallet is detected, connect it so the app can show your account and chain details.</p>
              </div>
              <div className="support-list-item">
                <strong>2. Verify the lot with the buyer</strong>
                <p>Use the video room before moving to escrow-backed checkout.</p>
              </div>
              <div className="support-list-item">
                <strong>3. Let the buyer lock escrow</strong>
                <p>The buyer listing detail page can lock payment after both sides are satisfied.</p>
              </div>
            </div>
          </section>
        </div>
      );
    }

    return (
      <div className="workspace-panel-grid">
        <section className="card support-card">
          <p className="kicker">Quick start</p>
          <h3>Best order for a farmer demo</h3>
          <div className="support-list">
            <div className="support-list-item">
              <strong>Start in Sell Crop</strong>
              <p>Create a clean listing first so buyers immediately see the crop, price, and image.</p>
            </div>
            <div className="support-list-item">
              <strong>Use Voice if you want speed</strong>
              <p>The voice page helps you capture a listing or jump toward buyer communication faster.</p>
            </div>
            <div className="support-list-item">
              <strong>Check Inventory after that</strong>
              <p>Review the saved lot, open its detail page, and move to live verification or escrow.</p>
            </div>
          </div>
        </section>

        <section className="card support-card">
          <p className="kicker">Next actions</p>
          <h3>Jump to the exact task you need</h3>
          <div className="workspace-quick-grid">
            <Link className="workspace-quick-card" href="/farmer?section=sell">
              <strong>Create a new listing</strong>
              <span>Add crop, location, quantity, and price.</span>
            </Link>
            <Link className="workspace-quick-card" href="/farmer?section=voice">
              <strong>Use voice commands</strong>
              <span>Start a listing or trigger the next step with speech.</span>
            </Link>
            <Link className="workspace-quick-card" href="/farmer?section=inventory">
              <strong>Open my listings</strong>
              <span>Review your lots and jump to calls or detail pages.</span>
            </Link>
            <Link className="workspace-quick-card" href="/farmer?section=wallet">
              <strong>Connect wallet</strong>
              <span>Prepare MetaMask for escrow-backed actions.</span>
            </Link>
          </div>
        </section>

        <section className="card support-card">
          <p className="kicker">Image placeholders</p>
          <h3>Files ready for your real crop photos</h3>
          <div className="support-list">
            {productImageLibrary.map((image) => (
              <div key={image.path} className="info-row">
                <span>{image.crop}</span>
                <strong>{image.path.split("/").pop()}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <RoleShell
      role="Farmer"
      title="Sell crops faster with a clearer, user-first seller dashboard."
      description="This farmer area is now split into simple sections so anyone can understand where to create a listing, use voice, review inventory, and connect a wallet."
    >
      <section className="metrics-row">
        <article className="card metric-card">
          <span>Open lots</span>
          <strong>{myListings.length}</strong>
        </article>
        <article className="card metric-card">
          <span>Total quantity</span>
          <strong>{totalKg} kg</strong>
        </article>
        <article className="card metric-card">
          <span>Voice actions</span>
          <strong>5 commands</strong>
        </article>
        <article className="card metric-card">
          <span>Live calls ready</span>
          <strong>{myListings.filter((listing) => listing.liveRoomId).length}</strong>
        </article>
      </section>

      <section className="card workspace-shell">
        <div className="workspace-shell-header">
          <div>
            <p className="kicker">Farmer dashboard menu</p>
            <h2>{sectionMeta.title}</h2>
            <p>{sectionMeta.description}</p>
          </div>
          <span className="tag">Current section: {sectionMeta.label}</span>
        </div>

        <nav className="workspace-tab-row" aria-label="Farmer workspace sections">
          {farmerSections.map((section) => {
            const isActive = section.id === activeSection;

            return (
              <Link
                key={section.id}
                href={`/farmer?section=${section.id}`}
                className={`workspace-tab ${isActive ? "workspace-tab-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <strong>{section.label}</strong>
                <span>{section.description}</span>
              </Link>
            );
          })}
        </nav>

        <div className="workspace-section-stack">{renderSection()}</div>
      </section>
    </RoleShell>
  );
}
