import { AnalysisResult } from "@/lib/types";

type AiResponse = {
  prediction?: string;
  confidence?: number;
  recommendations?: string[];
  suggested_price_per_kg?: number;
  freshness?: number;
  quality_grade?: AnalysisResult["qualityGrade"];
};

export async function analyzeCropImage(
  listingId: string,
  crop: string,
  imageUrl?: string
): Promise<AnalysisResult> {
  const serviceUrl = process.env.AI_SERVICE_URL;

  if (serviceUrl) {
    try {
      const formData = new FormData();
      const contents = new Blob([imageUrl ?? listingId], { type: "text/plain" });
      formData.append("file", contents, `${crop.toLowerCase()}-${listingId}.txt`);
      formData.append("crop", crop);

      const response = await fetch(`${serviceUrl}/predict`, {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const payload = (await response.json()) as AiResponse;
        return {
          crop,
          disease: payload.prediction ?? "Healthy",
          confidence: payload.confidence ?? 0.84,
          freshness: payload.freshness ?? 0.82,
          qualityGrade: payload.quality_grade ?? "A",
          suggestedPricePerKg: payload.suggested_price_per_kg ?? 32,
          recommendations: payload.recommendations ?? ["Keep batch dry and ventilated."]
        };
      }
    } catch {
      // fall back to demo heuristic below
    }
  }

  const hashSeed = Array.from(`${listingId}${crop}`).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const confidence = 0.8 + (hashSeed % 14) / 100;
  const freshness = 0.74 + (hashSeed % 16) / 100;
  const price = 22 + (hashSeed % 28);
  const disease = hashSeed % 4 === 0 ? "Early Blight Watch" : "Healthy";
  const qualityGrade: AnalysisResult["qualityGrade"] = confidence > 0.91 ? "A+" : confidence > 0.86 ? "A" : "B";

  return {
    crop,
    disease,
    confidence,
    freshness,
    qualityGrade,
    suggestedPricePerKg: price,
    recommendations: disease === "Healthy"
      ? ["Proceed with premium buyer outreach.", "Dispatch within 24 to 48 hours."]
      : ["Schedule a manual review.", "Separate affected produce before dispatch."]
  };
}

