# services/skincare_analysis.py - Version mémoire sans fichiers
from PIL import Image
import cv2
import numpy as np
from transformers import CLIPProcessor, CLIPModel
import torch
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SkincareAnalyzer:
    def __init__(self):
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Utilisation du device: {self.device}")

        # Types de peau et problèmes à détecter
        self.skin_types = [
            "peau grasse",
            "peau sèche",
            "peau mixte",
            "peau normale",
            "peau sensible"
        ]

        self.skin_problems = [
            "acné",
            "points noirs",
            "boutons",
            "rides",
            "taches brunes",
            "rougeurs",
            "pores dilatés",
            "cernes",
            "sécheresse cutanée",
            "brillance excessive"
        ]

        self.skin_conditions = [
            "peau lisse",
            "peau rugueuse",
            "peau terne",
            "peau éclatante",
            "peau fatiguée",
            "peau hydratée"
        ]

    def load_model(self):
        """Charge le modèle CLIP de manière lazy"""
        if self.processor is None or self.model is None:
            logger.info("Chargement du modèle CLIP...")
            self.processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
            self.model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")

            # Déplacer le modèle sur GPU si disponible
            if self.device == "cuda":
                self.model = self.model.to(self.device)

            logger.info("Modèle CLIP chargé avec succès")

    def preprocess_pil_image(self, pil_image: Image.Image, analysis_id: str):
        """Prétraitement d'une image PIL directement en mémoire"""
        try:
            # Convertir PIL en array numpy pour OpenCV
            img_array = np.array(pil_image)
            img = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

            logger.info(f"Image originale: {img.shape}")

            # Détection de visage pour cropper la zone d'intérêt
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            # Si un visage est détecté, on crop autour
            if len(faces) > 0:
                (x, y, w, h) = faces[0]  # Prendre le premier visage
                # Agrandir la zone pour inclure plus de peau
                margin = int(0.2 * max(w, h))
                x1 = max(0, x - margin)
                y1 = max(0, y - margin)
                x2 = min(img.shape[1], x + w + margin)
                y2 = min(img.shape[0], y + h + margin)

                img = img[y1:y2, x1:x2]
                logger.info(f"Visage détecté et cropé pour l'analyse: {img.shape}")

            # Redimensionner
            target_size = 224  # Taille optimale pour CLIP
            img = cv2.resize(img, (target_size, target_size))

            # Améliorer les détails de la peau
            # Réduction du bruit tout en préservant les détails
            img = cv2.bilateralFilter(img, 9, 75, 75)

            # Amélioration légère du contraste
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
            cl = clahe.apply(l)
            enhanced_img = cv2.merge((cl, a, b))
            enhanced_img = cv2.cvtColor(enhanced_img, cv2.COLOR_LAB2BGR)

            # Reconvertir en PIL pour CLIP
            enhanced_img_rgb = cv2.cvtColor(enhanced_img, cv2.COLOR_BGR2RGB)
            processed_pil = Image.fromarray(enhanced_img_rgb)

            logger.info(f"Image prétraitée: {processed_pil.size} (ID: {analysis_id})")
            return processed_pil

        except Exception as e:
            logger.error(f"Erreur lors du prétraitement: {str(e)}")
            # Retourner l'image originale en cas d'erreur
            return pil_image

    async def analyze_skin_from_memory(self, pil_image: Image.Image, analysis_id: str):
        """Analyse la peau avec CLIP directement depuis une image PIL"""
        try:
            # Charger le modèle
            self.load_model()

            # Prétraitement
            processed_image = self.preprocess_pil_image(pil_image, analysis_id)

            # Analyser le type de peau
            skin_type = await self._classify_image(processed_image, self.skin_types, "Type de peau")

            # Analyser les problèmes de peau
            skin_problems = await self._detect_multiple_conditions(processed_image, self.skin_problems, "Problèmes détectés", threshold=0.3)

            # Analyser l'état général
            skin_condition = await self._classify_image(processed_image, self.skin_conditions, "État de la peau")

            # Compiler les résultats
            analysis_result = {
                "skin_type": skin_type,
                "problems_detected": skin_problems,
                "skin_condition": skin_condition,
                "confidence_note": "Analyse basée sur l'intelligence artificielle CLIP. Traitement 100% en mémoire pour une confidentialité maximale. Pour un diagnostic précis, consultez un dermatologue.",
                "processing_method": "in_memory",
                "analysis_id": analysis_id
            }

            # Nettoyage mémoire
            del processed_image

            return analysis_result

        except Exception as e:
            logger.error(f"Erreur lors de l'analyse: {str(e)}")
            return {
                "error": f"Erreur lors de l'analyse: {str(e)}",
                "skin_type": {"category": "indéterminé", "confidence": 0.0, "all_scores": {}},
                "problems_detected": [],
                "skin_condition": {"category": "indéterminé", "confidence": 0.0, "all_scores": {}},
                "confidence_note": "Erreur lors de l'analyse. Veuillez réessayer.",
                "processing_method": "in_memory_error",
                "analysis_id": analysis_id
            }

    async def _classify_image(self, image: Image.Image, categories, category_name):
        """Classifie l'image parmi les catégories données"""
        try:
            # Préparer les inputs
            inputs = self.processor(text=categories, images=image, return_tensors="pt", padding=True)

            # Déplacer sur GPU si disponible
            if self.device == "cuda":
                inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Calcul des similarités
            with torch.no_grad():
                outputs = self.model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)

            # Trouver la catégorie avec la plus haute probabilité
            max_prob_idx = probs.argmax().item()
            max_prob = probs.max().item()

            result = {
                "category": categories[max_prob_idx],
                "confidence": float(max_prob),
                "all_scores": {categories[i]: float(probs[0][i]) for i in range(len(categories))}
            }

            logger.info(f"{category_name}: {result['category']} (confiance: {result['confidence']:.2f})")
            return result

        except Exception as e:
            logger.error(f"Erreur lors de la classification {category_name}: {str(e)}")
            return {"category": "indéterminé", "confidence": 0.0, "all_scores": {}}

    async def _detect_multiple_conditions(self, image: Image.Image, conditions, category_name, threshold=0.25):
        """Détecte plusieurs conditions simultanément avec un seuil"""
        try:
            detected = []

            for condition in conditions:
                # Créer un prompt binaire pour chaque condition
                binary_prompt = [f"visage avec {condition}", f"visage sans {condition}"]

                inputs = self.processor(text=binary_prompt, images=image, return_tensors="pt", padding=True)

                if self.device == "cuda":
                    inputs = {k: v.to(self.device) for k, v in inputs.items()}

                with torch.no_grad():
                    outputs = self.model(**inputs)
                    logits_per_image = outputs.logits_per_image
                    probs = logits_per_image.softmax(dim=1)

                # Probabilité que la condition soit présente
                prob_present = probs[0][0].item()

                if prob_present > threshold:
                    detected.append({
                        "condition": condition,
                        "confidence": prob_present
                    })

            # Trier par confiance décroissante
            detected.sort(key=lambda x: x['confidence'], reverse=True)

            logger.info(f"{category_name}: {len(detected)} conditions détectées")
            return detected

        except Exception as e:
            logger.error(f"Erreur lors de la détection {category_name}: {str(e)}")
            return []

# Instance globale
skincare_analyzer = SkincareAnalyzer()

# Nouvelle fonction pour traitement en mémoire
async def analyze_skincare_from_memory(pil_image: Image.Image, analysis_id: str):
    """Fonction wrapper pour l'analyse skincare en mémoire"""
    return await skincare_analyzer.analyze_skin_from_memory(pil_image, analysis_id)

# Ancienne fonction pour compatibilité (si besoin)
async def analyze_skincare(image_path):
    """Fonction wrapper pour l'analyse skincare depuis un fichier (deprecated)"""
    try:
        pil_image = Image.open(image_path).convert('RGB')
        analysis_id = "file_based_analysis"
        return await skincare_analyzer.analyze_skin_from_memory(pil_image, analysis_id)
    except Exception as e:
        logger.error(f"Erreur lors de l'analyse depuis fichier: {str(e)}")
        return {
            "error": str(e),
            "skin_type": {"category": "indéterminé", "confidence": 0.0},
            "problems_detected": [],
            "skin_condition": {"category": "indéterminé", "confidence": 0.0}
        }