from hashlib import sha256

from app.schemas.prediction import PredictionResponse


DISEASE_CLASSES = [
    "Healthy",
    "Leaf Spot Watch",
    "Early Blight Watch",
    "Mild Nutrient Stress",
]


def predict_from_bytes(file_bytes: bytes, crop: str | None = None) -> PredictionResponse:
    digest = sha256(file_bytes).hexdigest()
    seed = int(digest[:8], 16)
    confidence = 0.82 + ((seed % 14) / 100)
    freshness = 0.76 + (((seed // 3) % 18) / 100)
    disease = DISEASE_CLASSES[seed % len(DISEASE_CLASSES)]
    quality_grade = "A+" if confidence > 0.93 else "A" if confidence > 0.88 else "B"
    price = 20 + (seed % 35)

    recommendations = (
        [
            "Cold-store the batch before dispatch.",
            "Promote this lot to premium buyers.",
        ]
        if disease == "Healthy"
        else [
            "Route for manual agronomist review.",
            "Separate affected produce before shipment.",
        ]
    )

    return PredictionResponse(
        prediction=f"{crop or 'Crop'}: {disease}",
        confidence=min(confidence, 0.99),
        freshness=min(freshness, 0.98),
        quality_grade=quality_grade,
        suggested_price_per_kg=price,
        recommendations=recommendations,
    )

