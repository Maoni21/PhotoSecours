# main.py - SkinCare AI App
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from services.skincare_analysis import analyze_skincare
from services.skincare_recommendation import generate_skincare_recommendations
from models.schemas import SkincareAnalysisResponse, ErrorResponse, HealthResponse
import uuid

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SkinCare AI API",
    description="API d'analyse de peau et recommandations skincare personnalisées avec IA",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À modifier en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/", response_model=HealthResponse)
def read_root():
    """Page d'accueil de l'API SkinCare AI"""
    return HealthResponse(
        status="operational",
        services=["skincare_analysis", "skin_recommendations"],
        version="1.0.0"
    )

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Endpoint de vérification de santé"""
    return HealthResponse(
        status="healthy",
        services=["skincare-ai"]
    )

@app.post("/api/analyze", response_model=SkincareAnalysisResponse)
async def analyze_skin(file: UploadFile = File(...)):
    """
    🔍 Analyse une photo de peau et génère des recommandations skincare personnalisées

    Upload une photo de ton visage et reçois :
    - Type de peau détecté (grasse, sèche, mixte, etc.)
    - Problèmes identifiés (acné, rides, taches, etc.)
    - Routine skincare personnalisée
    - Produits et ingrédients recommandés
    """

    # Validation du fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="❌ Le fichier doit être une image (JPEG, PNG, etc.)"
        )

    # Vérification de la taille
    content = await file.read()
    file_size = len(content)

    if file_size > 15 * 1024 * 1024:  # 15MB pour skincare
        raise HTTPException(
            status_code=413,
            detail="❌ Image trop volumineuse. Taille maximale: 15MB"
        )

    if file_size < 1024:  # Minimum 1KB
        raise HTTPException(
            status_code=400,
            detail="❌ Image trop petite ou corrompue"
        )

    try:
        # Génération ID unique
        analysis_id = str(uuid.uuid4())

        # Extension du fichier
        file_extension = "jpg"
        if file.filename:
            file_extension = file.filename.split(".")[-1].lower()
            if file_extension not in ["jpg", "jpeg", "png", "bmp", "tiff", "webp"]:
                file_extension = "jpg"

        # Sauvegarde sécurisée
        file_path = f"{UPLOAD_DIR}/skin_{analysis_id}.{file_extension}"

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        logger.info(f"✅ Image skincare sauvegardée: {file_path} ({file_size/1024:.1f}KB)")

        # 🔍 Analyse avec CLIP
        logger.info("🔍 Début de l'analyse de peau avec CLIP...")
        skin_analysis = await analyze_skincare(file_path)
        logger.info("✅ Analyse de peau terminée")

        # 💡 Génération des recommandations
        logger.info("💡 Génération des recommandations skincare...")
        recommendations = await generate_skincare_recommendations(skin_analysis)
        logger.info("✅ Recommandations générées")

        # 📋 Construction de la réponse
        response = SkincareAnalysisResponse(
            id=analysis_id,
            skin_type=skin_analysis.get("skin_type", {}),
            problems_detected=skin_analysis.get("problems_detected", []),
            skin_condition=skin_analysis.get("skin_condition", {}),
            recommendations=recommendations,
            confidence_note=skin_analysis.get("confidence_note", "")
        )

        logger.info(f"🎉 Analyse skincare terminée avec succès pour {analysis_id}")

        # Nettoyage optionnel (garder ou supprimer selon tes besoins)
        # os.remove(file_path)

        return response

    except Exception as e:
        logger.error(f"❌ Erreur lors de l'analyse skincare: {str(e)}")

        # Nettoyage en cas d'erreur
        if 'file_path' in locals() and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("🧹 Fichier temporaire nettoyé")
            except:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"❌ Erreur lors de l'analyse: {str(e)}"
        )

@app.get("/api/skin-types")
def get_skin_types():
    """📋 Liste des types de peau détectables"""
    return {
        "skin_types": [
            {"type": "peau grasse", "description": "Production excessive de sébum"},
            {"type": "peau sèche", "description": "Manque d'hydratation et de sébum"},
            {"type": "peau mixte", "description": "Zone T grasse, joues normales/sèches"},
            {"type": "peau normale", "description": "Équilibre optimal eau/sébum"},
            {"type": "peau sensible", "description": "Réactivité aux produits et environnement"}
        ]
    }

@app.get("/api/skin-problems")
def get_detectable_problems():
    """🔍 Liste des problèmes de peau détectables"""
    return {
        "problems": [
            {"problem": "acné", "severity": "medium", "treatable": True},
            {"problem": "points noirs", "severity": "low", "treatable": True},
            {"problem": "rides", "severity": "low", "treatable": True},
            {"problem": "taches brunes", "severity": "medium", "treatable": True},
            {"problem": "rougeurs", "severity": "medium", "treatable": True},
            {"problem": "pores dilatés", "severity": "low", "treatable": True},
            {"problem": "cernes", "severity": "low", "treatable": True}
        ]
    }

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Gestionnaire d'exceptions HTTP"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Gestionnaire d'exceptions général"""
    logger.error(f"❌ Erreur non gérée: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Une erreur interne s'est produite lors de l'analyse",
            "detail": "Veuillez réessayer ou contacter le support",
            "status_code": 500
        }
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