# models/schemas.py - SkinCare AI Schemas
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from datetime import datetime

# ==========================================
# SCHÉMAS PRINCIPAUX SKINCARE
# ==========================================

class SkinClassification(BaseModel):
    """Classification du type ou état de peau"""
    category: str = Field(description="Catégorie détectée (ex: peau grasse, peau sèche)")
    confidence: float = Field(description="Niveau de confiance (0.0 à 1.0)", ge=0.0, le=1.0)
    all_scores: Dict[str, float] = Field(default={}, description="Scores pour toutes les catégories")

class SkinProblem(BaseModel):
    """Problème de peau détecté"""
    condition: str = Field(description="Problème détecté (ex: acné, rides, taches)")
    confidence: float = Field(description="Niveau de confiance de détection", ge=0.0, le=1.0)

class SkincareRecommendation(BaseModel):
    """Recommandations skincare complètes"""
    routine_steps: List[str] = Field(description="Étapes de routine skincare matin/soir")
    products_recommended: List[str] = Field(description="Produits cosmétiques spécifiques recommandés")
    ingredients_to_look_for: List[str] = Field(description="Ingrédients actifs bénéfiques à rechercher")
    ingredients_to_avoid: List[str] = Field(description="Ingrédients à éviter pour votre type de peau")
    lifestyle_tips: List[str] = Field(description="Conseils de mode de vie et habitudes")
    severity: str = Field(description="Gravité des problèmes: low, normal, high", default="normal")
    consult_dermatologist: bool = Field(description="Recommandation de consulter un dermatologue")
    disclaimer: str = Field(description="Avertissement sur les recommandations IA")

class SkincareAnalysisResponse(BaseModel):
    """Réponse complète d'analyse skincare"""
    id: str = Field(description="Identifiant unique de l'analyse")
    skin_type: SkinClassification = Field(description="Type de peau principal détecté")
    problems_detected: List[SkinProblem] = Field(description="Liste des problèmes de peau identifiés")
    skin_condition: SkinClassification = Field(description="État général actuel de la peau")
    recommendations: SkincareRecommendation = Field(description="Recommandations personnalisées complètes")
    confidence_note: str = Field(description="Note sur la fiabilité de l'analyse IA")

# ==========================================
# SCHÉMAS UTILITAIRES
# ==========================================

class ErrorResponse(BaseModel):
    """Réponse d'erreur standardisée"""
    error: str = Field(description="Message d'erreur principal")
    detail: Optional[str] = Field(default=None, description="Détails supplémentaires sur l'erreur")
    status_code: int = Field(description="Code de statut HTTP")
    timestamp: datetime = Field(default_factory=datetime.now, description="Horodatage de l'erreur")

class HealthResponse(BaseModel):
    """Réponse de vérification de santé du service"""
    status: str = Field(description="État du service: healthy, operational, degraded")
    services: Optional[List[str]] = Field(default=None, description="Liste des services disponibles")
    version: Optional[str] = Field(default=None, description="Version de l'API")

# ==========================================
# SCHÉMAS INFORMATIFS
# ==========================================

class SkinTypeInfo(BaseModel):
    """Information sur un type de peau"""
    type: str = Field(description="Nom du type de peau")
    description: str = Field(description="Description détaillée")
    characteristics: Optional[List[str]] = Field(default=None, description="Caractéristiques principales")

class SkinProblemInfo(BaseModel):
    """Information sur un problème de peau"""
    problem: str = Field(description="Nom du problème")
    severity: str = Field(description="Gravité typique: low, medium, high")
    treatable: bool = Field(description="Si le problème est traitable avec des cosmétiques")
    description: Optional[str] = Field(default=None, description="Description du problème")

# ==========================================
# SCHÉMAS POUR FUTURES EXTENSIONS
# ==========================================

class ImageMetadata(BaseModel):
    """Métadonnées optionnelles pour les images analysées"""
    model_config = ConfigDict(protected_namespaces=())

    file_size: Optional[int] = Field(default=None, description="Taille du fichier en bytes")
    image_dimensions: Optional[Dict[str, int]] = Field(default=None, description="Largeur et hauteur")
    processing_time: Optional[float] = Field(default=None, description="Temps de traitement en secondes")
    model_used: str = Field(default="CLIP", description="Modèle IA utilisé pour l'analyse")
    face_detected: Optional[bool] = Field(default=None, description="Si un visage a été détecté")

class DetailedAnalysisResponse(SkincareAnalysisResponse):
    """Version étendue avec métadonnées détaillées"""
    metadata: Optional[ImageMetadata] = Field(default=None, description="Métadonnées de traitement")
    processing_timestamp: datetime = Field(default_factory=datetime.now, description="Horodatage du traitement")

class SkincareHistory(BaseModel):
    """Historique d'analyses pour suivi dans le temps"""
    user_id: Optional[str] = Field(default=None, description="ID utilisateur (optionnel)")
    analyses: List[SkincareAnalysisResponse] = Field(description="Liste des analyses chronologiques")
    skin_evolution: Optional[Dict[str, Any]] = Field(default=None, description="Évolution détectée")