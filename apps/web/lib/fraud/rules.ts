import { FraudFlag, Listing } from "@/lib/types";

function hashLike(input: string) {
  let acc = 0;
  for (const char of input) {
    acc = (acc * 31 + char.charCodeAt(0)) % 100000;
  }
  return acc;
}

export function evaluateFraud(listing: Listing): FraudFlag[] {
  const createdAt = new Date().toISOString();
  const flags: FraudFlag[] = [];

  if (listing.quantityKg > 5000) {
    flags.push({
      id: `flag-${hashLike(`${listing.id}-qty`)}`,
      batchId: listing.batchId,
      listingId: listing.id,
      rule: "abnormal_quantity",
      severity: "high",
      detail: "Quantity is unusually high for a single hackathon demo farm listing.",
      createdAt
    });
  }

  if (listing.pricePerKg < 5 || listing.pricePerKg > 250) {
    flags.push({
      id: `flag-${hashLike(`${listing.id}-price`)}`,
      batchId: listing.batchId,
      listingId: listing.id,
      rule: "price_deviation",
      severity: "medium",
      detail: "Price falls outside the fair-price watch band and should be reviewed.",
      createdAt
    });
  }

  if (listing.images.length > 0) {
    const first = listing.images[0].toLowerCase();
    if (first.includes("sample") || first.includes("duplicate")) {
      flags.push({
        id: `flag-${hashLike(`${listing.id}-image`)}`,
        batchId: listing.batchId,
        listingId: listing.id,
        rule: "duplicate_image_hint",
        severity: "medium",
        detail: "Uploaded image name suggests the same file may have been reused across batches.",
        createdAt
      });
    }
  }

  if (/far away|unknown/i.test(listing.location)) {
    flags.push({
      id: `flag-${hashLike(`${listing.id}-location`)}`,
      batchId: listing.batchId,
      listingId: listing.id,
      rule: "location_mismatch",
      severity: "high",
      detail: "Listing location needs review because it does not map to a registered farm area.",
      createdAt
    });
  }

  return flags;
}

