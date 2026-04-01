from fastapi import APIRouter

from app.schemas.prediction import ModelInfoResponse

router = APIRouter()


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai", "mode": "demo-heuristic"}


@router.get("/model/info", response_model=ModelInfoResponse)
async def model_info():
    return ModelInfoResponse(
        model_name="agritrust-demo-analyzer",
        mode="heuristic",
        supported_crops=["tomato", "rice", "potato", "grape", "corn", "chilli"],
        supported_classes=["Healthy", "Leaf Spot Watch", "Early Blight Watch", "Mild Nutrient Stress"],
    )

