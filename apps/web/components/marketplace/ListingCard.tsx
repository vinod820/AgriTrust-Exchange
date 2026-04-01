import Link from "next/link";
import { getProductImageForCrop } from "@/lib/data/product-images";
import { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  const image = listing.images[0] || getProductImageForCrop(listing.crop);

  return (
    <article className="card listing-card">
      <div className="listing-media">
        <img src={image} alt={`${listing.crop} from ${listing.farmerName}`} />
        <div className="listing-media-badges">
          <span
            className={`status-pill ${
              listing.status === "flagged" ? "status-danger" : listing.verified ? "status-success" : "status-warning"
            }`}
          >
            {listing.status.replaceAll("_", " ")}
          </span>
          <span className="tag">Trust {listing.trustScore}</span>
        </div>
      </div>

      <div className="listing-body">
        <div className="listing-title-row">
          <div>
            <p className="kicker">{listing.location}</p>
            <h3>{listing.crop}</h3>
          </div>
          <strong className="listing-price">Rs {listing.pricePerKg}/kg</strong>
        </div>

        <p className="listing-description">{listing.description}</p>

        <div className="listing-metrics">
          <div className="listing-metric">
            <span>Quantity</span>
            <strong>{listing.quantityKg} kg</strong>
          </div>
          <div className="listing-metric">
            <span>Quality</span>
            <strong>{listing.qualityGrade}</strong>
          </div>
          <div className="listing-metric">
            <span>Farmer</span>
            <strong>{listing.farmerName}</strong>
          </div>
        </div>

        <div className="tag-row">
          <span className="tag">Batch {listing.batchId}</span>
          <span className="tag">{listing.aiAnalysis?.disease ?? "AI pending"}</span>
        </div>

        <div className="listing-actions">
          <Link href={`/listing/${listing.id}`} className="button" data-voice={`view ${listing.crop.toLowerCase()} details open listing detail page`}>
            View details
          </Link>
          <Link href={`/call/${listing.liveRoomId ?? `room-${listing.id}`}`} className="ghost-button" data-voice={`verify ${listing.crop.toLowerCase()} live open video room join call call buyer connect buyer video call`}>
            Verify live
          </Link>
        </div>
      </div>
    </article>
  );
}
