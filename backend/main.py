# main.py - SkinCare AI App sans dossiers uploads
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
import logging
from PIL import Image
from services.skincare_analysis import analyze_skincare_from_memory
from services.skincare_recommendation import generate_skincare_recommendations
from services.face_validation import validate_face_for_skincare
from models.schemas import SkincareAnalysisResponse, ErrorResponse, HealthResponse
import uuid

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SkinCare AI API",
    description="API d'analyse de peau et recommandations skincare personnalisées avec IA (sans stockage)",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À modifier en production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_model=HealthResponse)
def read_root():
    """Page d'accueil de l'API SkinCare AI"""
    return HealthResponse(
        status="operational",
        services=["skincare_analysis_memory", "skin_recommendations", "no_storage"],
        version="2.0.0"
    )

@app.get("/health", response_model=HealthResponse)
def health_check():
    """Endpoint de vérification de santé"""
    return HealthResponse(
        status="healthy",
        services=["skincare-ai-memory"]
    )

@app.post("/api/analyze", response_model=SkincareAnalysisResponse)
async def analyze_skin(file: UploadFile = File(...)):
    """
    🔍 Analyse une photo de peau directement en mémoire (sans stockage)

    Upload une photo de ton visage et reçois :
    - Type de peau détecté (grasse, sèche, mixte, etc.)
    - Problèmes identifiés (acné, rides, taches, etc.)
    - Routine skincare personnalisée
    - Produits et ingrédients recommandés

    ✨ Avantages: Pas de stockage, traitement immédiat, confidentialité maximale
    """

    # Validation du fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="❌ Le fichier doit être une image (JPEG, PNG, etc.)"
        )

    # Lire le contenu du fichier en mémoire
    content = await file.read()
    file_size = len(content)

    # Vérification de la taille
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
        # Génération ID unique pour cette analyse
        analysis_id = str(uuid.uuid4())

        logger.info(f"✅ Image reçue en mémoire: {file.filename} ({file_size/1024:.1f}KB)")

        # 🖼️ Conversion en objet PIL directement depuis les bytes
        try:
            image_stream = io.BytesIO(content)
            pil_image = Image.open(image_stream).convert('RGB')
            logger.info(f"📸 Image convertie: {pil_image.size} pixels")
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Image corrompue ou format non supporté: {str(e)}"
            )

        # 🔍 ÉTAPE 1: Validation que c'est bien un visage humain
        logger.info("🔍 Validation du visage humain...")
        validation_result = await validate_face_for_skincare(pil_image)

        if not validation_result["is_valid"]:
            logger.warning(f"❌ Image rejetée: {validation_result['reason']}")
            raise HTTPException(
                status_code=400,
                detail={
                    "error": validation_result["reason"],
                    "suggestion": validation_result["suggestion"],
                    "type": "face_validation_failed",
                    "details": validation_result["details"]
                }
            )

        logger.info("✅ Visage humain validé, analyse skincare autorisée")

        # 🔍 ÉTAPE 2: Analyse avec CLIP (maintenant qu'on sait que c'est un visage)
        logger.info("🔍 Début de l'analyse de peau avec CLIP (visage validé)...")
        skin_analysis = await analyze_skincare_from_memory(pil_image, analysis_id)
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

        # 🧹 Nettoyage automatique de la mémoire
        del content, image_stream, pil_image

        logger.info(f"🎉 Analyse skincare terminée avec succès pour {analysis_id} (aucun fichier stocké)")

        return response

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Erreur lors de l'analyse skincare: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"❌ Erreur lors de l'analyse: {str(e)}"
        )

@app.post("/api/validate-face")
async def validate_face_only(file: UploadFile = File(...)):
    """
    🔍 Valide uniquement si l'image contient un visage humain (sans analyse complète)

    Retourne:
    - is_valid: true/false
    - reason: explication du résultat
    - suggestion: conseil pour améliorer la photo
    """

    # Validation du fichier
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="❌ Le fichier doit être une image (JPEG, PNG, etc.)"
        )

    # Lire et convertir l'image
    content = await file.read()
    file_size = len(content)

    if file_size > 10 * 1024 * 1024:  # 10MB pour validation simple
        raise HTTPException(
            status_code=413,
            detail="❌ Image trop volumineuse. Taille maximale: 10MB"
        )

    try:
        # Conversion en PIL
        image_stream = io.BytesIO(content)
        pil_image = Image.open(image_stream).convert('RGB')

        # Validation uniquement
        validation_result = await validate_face_for_skincare(pil_image)

        # Nettoyage mémoire
        del content, image_stream, pil_image

        return {
            "file_name": file.filename,
            "file_size_kb": round(file_size/1024, 1),
            "validation": validation_result
        }

    except Exception as e:
        logger.error(f"❌ Erreur lors de la validation: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"❌ Erreur lors de la validation: {str(e)}"
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

@app.get("/api/features")
def get_app_features():
    """✨ Fonctionnalités de l'application SkinCare AI"""
    return {
        "storage_type": "in_memory_only",
        "face_validation": "enabled",
        "ai_models": ["CLIP-ViT-B/32", "OpenCV-HaarCascade"],
        "privacy_level": "maximum",
        "features": [
            "Validation automatique de visage humain",
            "Détection OpenCV + validation CLIP",
            "Aucun fichier stocké sur le serveur",
            "Traitement 100% en mémoire",
            "Rejet automatique des non-visages",
            "Messages d'erreur explicites",
            "Suggestions d'amélioration photo"
        ],
        "validation_criteria": {
            "face_detection": "OpenCV HaarCascade",
            "human_confirmation": "CLIP semantic analysis",
            "min_face_size": "5% of image area",
            "min_image_size": "50x50 pixels"
        }
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
    logger.error(f"❌ Erreur non gérée: {str(e)}")
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