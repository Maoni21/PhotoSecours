# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from services.image_analysis import analyze_image
from services.recommendation import generate_recommendations
from models.schemas import AnalysisResponse
import uuid

app = FastAPI(title="PhotoSecours API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # A modifier en production pour plus de sécurité
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_wound(file: UploadFile = File(...)):
    try:
        # Sauvegarde temporaire de l'image
        file_extension = file.filename.split(".")[-1]
        file_id = str(uuid.uuid4())
        file_path = f"{UPLOAD_DIR}/{file_id}.{file_extension}"

        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        # Analyse de l'image
        description = await analyze_image(file_path)

        # Génération des recommandations
        recommendations = await generate_recommendations(description)

        return {
            "id": file_id,
            "description": description,
            "recommendations": recommendations,
            "severity_level": recommendations.get("severity", "medium"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API PhotoSecours"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)