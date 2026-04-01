from fastapi import APIRouter, File, Form, UploadFile

from app.models.demo_predictor import predict_from_bytes
from app.schemas.prediction import PredictionResponse

router = APIRouter()


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    crop: str | None = Form(default=None),
):
    file_bytes = await file.read()
    return predict_from_bytes(file_bytes, crop)

