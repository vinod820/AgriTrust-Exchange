"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { formatWalletAddress, publishBatchOnChain, resolveListingPublishFailure } from "@/lib/contracts/client";
import { contracts, isBlockchainConfigured } from "@/lib/contracts/config";
import { productImageLibrary, getProductImageForCrop } from "@/lib/data/product-images";
import { createListingSchema, getListingFieldErrors, getListingValidationMessage, type ListingFieldErrors } from "@/lib/listings/validation";
import type { CreateListingInput } from "@/lib/types";

const initialState = {
  crop: "",
  farmerName: "Voice Farmer Demo",
  farmerWallet: "0xFA11...0011",
  location: "",
  quantityKg: "",
  pricePerKg: "",
  harvestDate: "",
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

export function CreateListingForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [fieldErrors, setFieldErrors] = useState<ListingFieldErrors>({});
  const [status, setStatus] = useState("Ready to register a crop lot.");
  const [explorerHref, setExplorerHref] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
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

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
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
      ...form,
      crop,
      location,
      quantityKg,
      pricePerKg,
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
            farmerName: form.farmerName.trim() || `Farmer ${formatWalletAddress(onChainResult.farmerAddress)}`,
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
        startTransition(() => {
          setForm(initialState);
        });
        setStatus(`Batch ${body.batchId} was published on-chain as #${body.onChainBatchId}.`);
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
    <section className="card">
      <div className="panel-title-row">
        <div>
          <p className="kicker">New batch</p>
          <h3>Register produce for sale</h3>
        </div>
        <span className="status-pill">Seller form</span>
      </div>
      <p className="section-copy">
        Keep the listing simple: crop, location, quantity, price, harvest date, and a clean description. The app will
        attach a local placeholder image automatically.
      </p>
      <form onSubmit={submitForm} className="field-grid">
        <label className="field">
          Crop
          <input value={form.crop} onChange={(event) => updateField("crop", event.target.value)} placeholder="Tomato" required minLength={2} name="crop" aria-label="crop" />
          {renderFieldError("crop")}
        </label>
        <label className="field">
          Farm location
          <input value={form.location} onChange={(event) => updateField("location", event.target.value)} placeholder="Nashik, Maharashtra" required minLength={2} name="location" aria-label="farm location" />
          {renderFieldError("location")}
        </label>
        <label className="field">
          Quantity (kg)
          <input value={form.quantityKg} onChange={(event) => updateField("quantityKg", event.target.value)} type="number" min="1" required name="quantity" aria-label="quantity" />
          {renderFieldError("quantityKg")}
        </label>
        <label className="field">
          Price per kg
          <input value={form.pricePerKg} onChange={(event) => updateField("pricePerKg", event.target.value)} type="number" min="1" required name="price" aria-label="price per kg" />
          {renderFieldError("pricePerKg")}
        </label>
        <label className="field">
          Harvest date
          <input value={form.harvestDate} onChange={(event) => updateField("harvestDate", event.target.value)} type="date" required name="harvest-date" aria-label="harvest date" />
          {renderFieldError("harvestDate")}
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Description
          <textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Fresh lot, same-day sorting, ready for video verification." required minLength={8} name="description" aria-label="description" />
          {renderFieldError("description")}
        </label>
        <div className="form-footer">
          <button
            className="button"
            type="submit"
            disabled={isSubmitting}
            data-voice="create listing add listing sell crop register crop"
          >
            {isSubmitting ? "Creating..." : "Create Listing"}
          </button>
          <span className="muted">{status}</span>
        </div>
        {explorerHref ? (
          <a
            href={explorerHref}
            target="_blank"
            rel="noreferrer"
            className="muted"
            style={{ gridColumn: "1 / -1", color: "var(--brand-primary)", textDecoration: "underline" }}
          >
            View this Polygon Amoy transaction on Polygonscan
          </a>
        ) : null}
      </form>
      <div className="asset-library">
        <p className="kicker">Image placeholders available</p>
        <div className="asset-chip-row">
          {productImageLibrary.map((image) => (
            <span key={image.path} className="asset-chip">
              {image.crop}: {image.path.split("/").pop()}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
