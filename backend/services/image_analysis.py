# services/image_analysis.py
from PIL import Image
import cv2
import numpy as np
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch
import os
import logging

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageAnalyzer:
    def __init__(self):
        self.processor = None
        self.model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Utilisation du device: {self.device}")

    def load_model(self):
        """Charge le modèle BLIP de manière lazy"""
        if self.processor is None or self.model is None:
            logger.info("Chargement du modèle BLIP...")
            self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
            self.model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

            # Déplacer le modèle sur GPU si disponible
            if self.device == "cuda":
                self.model = self.model.to(self.device)

            logger.info("Modèle BLIP chargé avec succès")

    async def preprocess_image(self, image_path):
        """Prétraitement de l'image pour améliorer la visibilité des blessures"""
        try:
            # Charger l'image avec OpenCV
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError(f"Impossible de charger l'image: {image_path}")

            # Redimensionner si nécessaire
            max_size = 1024
            h, w = img.shape[:2]
            if max(h, w) > max_size:
                scale = max_size / max(h, w)
                img = cv2.resize(img, (int(w * scale), int(h * scale)))

            # Améliorer le contraste avec CLAHE
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            enhanced_lab = cv2.merge((cl, a, b))
            enhanced_img = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

            # Détection et anonymisation des visages
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            if not face_cascade.empty():
                gray = cv2.cvtColor(enhanced_img, cv2.COLOR_BGR2GRAY)
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)

                for (x, y, w, h) in faces:
                    # Appliquer un flou gaussien sur les visages détectés
                    roi = enhanced_img[y:y+h, x:x+w]
                    blurred_roi = cv2.GaussianBlur(roi, (99, 99), 30)
                    enhanced_img[y:y+h, x:x+w] = blurred_roi

                logger.info(f"Anonymisé {len(faces)} visage(s) détecté(s)")

            # Sauvegarder l'image prétraitée
            processed_path = image_path.replace(".", "_processed.")
            cv2.imwrite(processed_path, enhanced_img)

            return processed_path

        except Exception as e:
            logger.error(f"Erreur lors du prétraitement: {str(e)}")
            return image_path  # Retourner l'image originale en cas d'erreur

    async def analyze_image(self, image_path):
        """Analyse l'image pour décrire la blessure avec BLIP"""
        try:
            # Charger le modèle si nécessaire
            self.load_model()

            # Prétraitement de l'image
            processed_path = await self.preprocess_image(image_path)

            # Charger l'image pour BLIP
            image = Image.open(processed_path).convert('RGB')

            # Prompts spécialisés pour les blessures
            prompts = [
                "Describe this medical wound or injury in detail, including location, size, color, and apparent severity",
                "What type of wound or injury is visible in this image?",
                "Describe the characteristics of this injury including any bleeding, swelling, or tissue damage"
            ]

            descriptions = []

            for prompt in prompts:
                try:
                    # Préparation des inputs
                    inputs = self.processor(image, prompt, return_tensors="pt")

                    # Déplacer sur GPU si disponible
                    if self.device == "cuda":
                        inputs = {k: v.to(self.device) for k, v in inputs.items()}

                    # Génération avec des paramètres optimisés
                    with torch.no_grad():
                        output = self.model.generate(
                            **inputs,
                            max_new_tokens=150,
                            num_beams=5,
                            no_repeat_ngram_size=2,
                            do_sample=True,
                            temperature=0.7,
                            early_stopping=True
                        )

                    # Décodage de la description
                    description = self.processor.decode(output[0], skip_special_tokens=True)

                    # Nettoyer la description (enlever le prompt s'il est répété)
                    if prompt in description:
                        description = description.replace(prompt, "").strip()

                    descriptions.append(description)

                except Exception as e:
                    logger.warning(f"Erreur avec le prompt '{prompt}': {str(e)}")
                    continue

            # Combiner les descriptions
            if descriptions:
                final_description = self._combine_descriptions(descriptions)
            else:
                final_description = "Impossible d'analyser l'image. Veuillez consulter un professionnel de santé."

            # Ajouter des métadonnées d'analyse
            analysis_metadata = {
                "processed_image_path": processed_path,
                "original_image_path": image_path,
                "device_used": self.device,
                "num_descriptions": len(descriptions)
            }

            # Ajouter un avertissement médical
            final_description += "\n\n⚠️ AVERTISSEMENT: Cette analyse est générée automatiquement par intelligence artificielle et ne remplace en aucun cas l'avis d'un professionnel de santé qualifié. En cas de blessure grave ou de doute, consultez immédiatement un médecin ou contactez les services d'urgence."

            return {
                "description": final_description,
                "metadata": analysis_metadata
            }

        except Exception as e:
            logger.error(f"Erreur lors de l'analyse d'image: {str(e)}")
            return {
                "description": f"Erreur lors de l'analyse: {str(e)}. Veuillez consulter un professionnel de santé.",
                "metadata": {"error": str(e)}
            }

    def _combine_descriptions(self, descriptions):
        """Combine plusieurs descriptions en une seule description cohérente"""
        if len(descriptions) == 1:
            return descriptions[0]

        # Logique simple de combinaison
        # Dans une version avancée, on pourrait utiliser un modèle de langage pour synthétiser
        combined = "Analyse de la blessure:\n\n"

        for i, desc in enumerate(descriptions, 1):
            if desc and desc.strip():
                combined += f"• {desc.strip()}\n"

        return combined.strip()

# Instance globale de l'analyseur
image_analyzer = ImageAnalyzer()

# Fonction wrapper pour compatibilité avec l'API existante
async def analyze_image(image_path):
    """Fonction wrapper pour maintenir la compatibilité avec l'API existante"""
    result = await image_analyzer.analyze_image(image_path)
    return result["description"]