from pydantic import BaseModel, Field


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description="Top predicted disease or crop health outcome.")
    confidence: float = Field(..., ge=0.0, le=1.0)
    freshness: float = Field(..., ge=0.0, le=1.0)
    quality_grade: str
    suggested_price_per_kg: int
    recommendations: list[str]


class ModelInfoResponse(BaseModel):
    model_name: str
    mode: str
    supported_crops: list[str]
    supported_classes: list[str]

