"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { productImageLibrary, getProductImageForCrop } from "@/lib/data/product-images";

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

export function CreateListingForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState("Ready to register a crop lot.");

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Submitting listing...");

    const payload = {
      ...form,
      quantityKg: Number(form.quantityKg),
      pricePerKg: Number(form.pricePerKg),
      images: [getProductImageForCrop(form.crop || "produce")]
    };

    const response = await fetch("/api/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    if (response.ok) {
      startTransition(() => {
        setForm(initialState);
      });
      setStatus(`Batch ${body.batchId} created. Open the buyer dashboard to see it.`);
      router.refresh();
      return;
    }

    setStatus(body.error ?? "Listing submission failed.");
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
          <input value={form.crop} onChange={(event) => setForm({ ...form, crop: event.target.value })} placeholder="Tomato" required name="crop" aria-label="crop" />
        </label>
        <label className="field">
          Farm location
          <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Nashik, Maharashtra" required name="location" aria-label="farm location" />
        </label>
        <label className="field">
          Quantity (kg)
          <input value={form.quantityKg} onChange={(event) => setForm({ ...form, quantityKg: event.target.value })} type="number" min="1" required name="quantity" aria-label="quantity" />
        </label>
        <label className="field">
          Price per kg
          <input value={form.pricePerKg} onChange={(event) => setForm({ ...form, pricePerKg: event.target.value })} type="number" min="1" required name="price" aria-label="price per kg" />
        </label>
        <label className="field">
          Harvest date
          <input value={form.harvestDate} onChange={(event) => setForm({ ...form, harvestDate: event.target.value })} type="date" required name="harvest-date" aria-label="harvest date" />
        </label>
        <label className="field" style={{ gridColumn: "1 / -1" }}>
          Description
          <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Fresh lot, same-day sorting, ready for video verification." required name="description" aria-label="description" />
        </label>
        <div className="form-footer">
          <button className="button" type="submit" data-voice="create listing add listing sell crop register crop">
            Create Listing
          </button>
          <span className="muted">{status}</span>
        </div>
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
