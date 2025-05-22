# main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from services.image_analysis import analyze_image
from services.recommendation import generate_recommendations
from models.schemas import AnalysisResponse
import uuid
import asyncio

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PhotoSecours API",
    description="API d'analyse d'images médicales pour les premiers soins",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À modifier en production pour plus de sécurité
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    """Endpoint racine pour vérifier que l'API fonctionne"""
    return {
        "message": "Bienvenue sur l'API PhotoSecours",
        "status": "operational",
        "version": "1.0.0"
    }

@app.get("/health")
def health_check():
    """Endpoint de vérification de santé pour Docker"""
    return {"status": "healthy", "service": "photosecours-api"}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_wound(file: UploadFile = File(...)):
    """
    Analyse une image de blessure et génère des recommandations de premiers soins
    """
    # Validation du fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit être une image (JPEG, PNG, etc.)"
        )

    # Limitation de la taille du fichier (10MB)
    file_size = 0
    content = await file.read()
    file_size = len(content)

    if file_size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(
            status_code=413,
            detail="Le fichier est trop volumineux. Taille maximale: 10MB"
        )

    try:
        # Génération d'un ID unique pour cette analyse
        file_id = str(uuid.uuid4())

        # Détermination de l'extension du fichier
        file_extension = "jpg"  # Par défaut
        if file.filename:
            file_extension = file.filename.split(".")[-1].lower()
            if file_extension not in ["jpg", "jpeg", "png", "bmp", "tiff"]:
                file_extension = "jpg"

        # Chemin de sauvegarde
        file_path = f"{UPLOAD_DIR}/{file_id}.{file_extension}"

        # Sauvegarde du fichier
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        logger.info(f"Image sauvegardée: {file_path}")

        # Analyse de l'image avec BLIP
        logger.info("Début de l'analyse d'image...")
        description = await analyze_image(file_path)
        logger.info("Analyse d'image terminée")

        # Génération des recommandations
        logger.info("Génération des recommandations...")
        recommendations = await generate_recommendations(description)
        logger.info("Recommandations générées")

        # Nettoyage optionnel du fichier temporaire (à configurer selon vos besoins)
        # os.remove(file_path)

        response = AnalysisResponse(
            id=file_id,
            description=description,
            recommendations=recommendations,
            severity_level=recommendations.severity,
        )

        logger.info(f"Analyse terminée avec succès pour {file_id}")
        return response

    except Exception as e:
        logger.error(f"Erreur lors de l'analyse: {str(e)}")

        # Nettoyage en cas d'erreur
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'analyse de l'image: {str(e)}"
        )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Gestionnaire d'exceptions général"""
    logger.error(f"Erreur non gérée: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Une erreur interne s'est produite"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        timeout_keep_alive=300
    )