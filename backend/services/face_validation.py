# services/face_validation.py - Validation de visage humain
from PIL import Image
import cv2
import numpy as np
from transformers import CLIPProcessor, CLIPModel
import torch
import logging

logger = logging.getLogger(__name__)

class FaceValidator:
    def __init__(self):
        self.clip_processor = None
        self.clip_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # Seuils de validation
        self.FACE_DETECTION_MIN_SIZE = (30, 30)  # Taille minimum du visage détecté
        self.CLIP_HUMAN_FACE_THRESHOLD = 0.6     # Seuil CLIP pour "visage humain"
        self.MIN_FACE_AREA_RATIO = 0.05          # Visage doit occuper au moins 5% de l'image

    def load_clip_model(self):
        """Charge le modèle CLIP pour validation sémantique"""
        if self.clip_processor is None or self.clip_model is None:
            logger.info("Chargement de CLIP pour validation de visage...")
            self.clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self.clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")

            if self.device == "cuda":
                self.clip_model = self.clip_model.to(self.device)

            logger.info("CLIP chargé pour validation")

    def detect_faces_opencv(self, pil_image: Image.Image) -> dict:
        """
        Détecte les visages avec OpenCV (méthode rapide et fiable)

        Returns:
            dict: Informations sur les visages détectés
        """
        try:
            # Convertir PIL en array pour OpenCV
            img_array = np.array(pil_image)
            img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Charger le classificateur de visages
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

            # Détecter les visages avec plusieurs échelles
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=self.FACE_DETECTION_MIN_SIZE,
                flags=cv2.CASCADE_SCALE_IMAGE
            )

            image_area = img.shape[0] * img.shape[1]
            face_info = []

            for (x, y, w, h) in faces:
                face_area = w * h
                area_ratio = face_area / image_area

                face_info.append({
                    "position": (x, y, w, h),
                    "area": face_area,
                    "area_ratio": area_ratio,
                    "size_valid": area_ratio >= self.MIN_FACE_AREA_RATIO
                })

            return {
                "faces_detected": len(faces),
                "faces_info": face_info,
                "has_valid_face": len([f for f in face_info if f["size_valid"]]) > 0
            }

        except Exception as e:
            logger.error(f"Erreur détection OpenCV: {str(e)}")
            return {
                "faces_detected": 0,
                "faces_info": [],
                "has_valid_face": False,
                "error": str(e)
            }

    async def validate_human_face_clip(self, pil_image: Image.Image) -> dict:
        """
        Valide qu'il s'agit bien d'un visage humain avec CLIP

        Returns:
            dict: Résultats de validation CLIP
        """
        try:
            self.load_clip_model()

            # Prompts pour validation
            validation_prompts = [
                "a human face",
                "a person's face",
                "human facial features",
                "not a human face",
                "an object",
                "a vehicle",
                "an animal",
                "text or document"
            ]

            # Analyse avec CLIP
            inputs = self.clip_processor(
                text=validation_prompts,
                images=pil_image,
                return_tensors="pt",
                padding=True
            )

            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)

            # Calculer les scores
            human_face_score = float(probs[0][0]) + float(probs[0][1]) + float(probs[0][2])  # Somme des 3 premiers
            non_face_score = float(probs[0][3]) + float(probs[0][4]) + float(probs[0][5]) + float(probs[0][6]) + float(probs[0][7])  # Somme des autres

            # Normaliser
            total_score = human_face_score + non_face_score
            human_face_confidence = human_face_score / total_score if total_score > 0 else 0

            is_human_face = human_face_confidence >= self.CLIP_HUMAN_FACE_THRESHOLD

            return {
                "is_human_face": is_human_face,
                "confidence": human_face_confidence,
                "threshold": self.CLIP_HUMAN_FACE_THRESHOLD,
                "detailed_scores": {
                    validation_prompts[i]: float(probs[0][i])
                    for i in range(len(validation_prompts))
                }
            }

        except Exception as e:
            logger.error(f"Erreur validation CLIP: {str(e)}")
            return {
                "is_human_face": False,
                "confidence": 0.0,
                "error": str(e)
            }

    async def validate_image_for_skincare(self, pil_image: Image.Image) -> dict:
        """
        Validation complète d'une image pour l'analyse skincare

        Returns:
            dict: Résultat complet de validation
        """
        logger.info("🔍 Début de la validation d'image pour skincare...")

        # 1. Validation basique de l'image
        if not isinstance(pil_image, Image.Image):
            return {
                "is_valid": False,
                "reason": "Format d'image invalide",
                "details": {"error": "L'objet fourni n'est pas une image PIL valide"}
            }

        # Vérifier les dimensions
        width, height = pil_image.size
        if width < 50 or height < 50:
            return {
                "is_valid": False,
                "reason": "Image trop petite",
                "details": {"size": pil_image.size, "min_required": (50, 50)}
            }

        # 2. Détection de visages avec OpenCV
        opencv_result = self.detect_faces_opencv(pil_image)

        # 3. Validation sémantique avec CLIP
        clip_result = await self.validate_human_face_clip(pil_image)

        # 4. Décision finale
        is_valid_face = (
                opencv_result["has_valid_face"] and  # OpenCV détecte un visage de taille correcte
                clip_result["is_human_face"]         # CLIP confirme que c'est un visage humain
        )

        # Messages d'erreur spécifiques
        if not opencv_result["has_valid_face"]:
            if opencv_result["faces_detected"] == 0:
                reason = "Aucun visage détecté dans l'image"
                suggestion = "Prenez une photo claire de votre visage face à l'appareil photo"
            else:
                reason = "Le visage détecté est trop petit dans l'image"
                suggestion = "Rapprochez-vous de l'appareil photo pour que votre visage soit plus visible"
        elif not clip_result["is_human_face"]:
            reason = "L'image ne semble pas contenir un visage humain"
            suggestion = "Assurez-vous d'uploader une photo de votre visage, pas d'un objet ou d'un animal"
        else:
            reason = "Image validée pour l'analyse skincare"
            suggestion = "Votre image est parfaite pour l'analyse !"

        result = {
            "is_valid": is_valid_face,
            "reason": reason,
            "suggestion": suggestion,
            "details": {
                "opencv_detection": opencv_result,
                "clip_validation": clip_result,
                "image_size": pil_image.size,
                "validation_passed": {
                    "face_detected": opencv_result["has_valid_face"],
                    "human_confirmed": clip_result["is_human_face"]
                }
            }
        }

        if is_valid_face:
            logger.info("✅ Image validée : visage humain détecté")
        else:
            logger.warning(f"❌ Image rejetée : {reason}")

        return result

# Instance globale
face_validator = FaceValidator()

# Fonction wrapper pour l'API
async def validate_face_for_skincare(pil_image: Image.Image) -> dict:
    """Fonction wrapper pour validation de visage"""
    return await face_validator.validate_image_for_skincare(pil_image)