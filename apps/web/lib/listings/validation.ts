import { z } from "zod";

export const createListingSchema = z.object({
  batchId: z.string().trim().min(2).optional(),
  crop: z.string().trim().min(2, "Crop must contain at least 2 characters."),
  farmerName: z.string().trim().min(2),
  farmerWallet: z.string().trim().min(4),
  location: z.string().trim().min(2, "Location must contain at least 2 characters."),
  quantityKg: z.number().positive("Quantity must be greater than 0."),
  pricePerKg: z.number().positive("Price per kg must be greater than 0."),
  harvestDate: z.string().trim().min(4, "Harvest date is required."),
  description: z.string().trim().min(8, "Description must contain at least 8 characters."),
  images: z.array(z.string()).optional(),
  onChainBatchId: z.number().int().positive().optional(),
  onChainTxHash: z.string().trim().min(4).optional(),
  geoLabel: z.string().trim().min(2).optional()
});

type ListingFieldKey =
  | "crop"
  | "location"
  | "quantityKg"
  | "pricePerKg"
  | "harvestDate"
  | "description";

export type ListingFieldErrors = Partial<Record<ListingFieldKey, string>>;

const listingFieldKeys = new Set<ListingFieldKey>([
  "crop",
  "location",
  "quantityKg",
  "pricePerKg",
  "harvestDate",
  "description"
]);

export function getListingFieldErrors(error: z.ZodError): ListingFieldErrors {
  const fieldErrors: ListingFieldErrors = {};

  error.issues.forEach((issue) => {
    const key = issue.path[0];
    if (typeof key !== "string" || !listingFieldKeys.has(key as ListingFieldKey)) {
      return;
    }

    const fieldKey = key as ListingFieldKey;
    if (!fieldErrors[fieldKey]) {
      fieldErrors[fieldKey] = issue.message;
    }
  });

  return fieldErrors;
}

export function getListingValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please complete all required listing fields.";
}
