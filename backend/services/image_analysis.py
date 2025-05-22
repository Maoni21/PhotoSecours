# services/image_analysis.py
from PIL import Image
import cv2
import numpy as np
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

# Chargement du modèle BLIP
processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-large")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-large")

async def preprocess_image(image_path):
    """Prétraitement de l'image pour améliorer la visibilité des blessures"""
    # Charger l'image avec OpenCV
    img = cv2.imread(image_path)

    # Redimensionner si nécessaire
    max_size = 1024
    h, w = img.shape[:2]
    if max(h, w) > max_size:
        scale = max_size / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))

    # Améliorer le contraste
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    enhanced_lab = cv2.merge((cl, a, b))
    enhanced_img = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

    # Anonymiser les visages (fonctionnalité simple)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(enhanced_img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    for (x, y, w, h) in faces:
        enhanced_img[y:y+h, x:x+w] = cv2.GaussianBlur(enhanced_img[y:y+h, x:x+w], (99, 99), 30)

    # Sauvegarder l'image prétraitée
    processed_path = image_path.replace(".", "_processed.")
    cv2.imwrite(processed_path, enhanced_img)

    return processed_path

async def analyze_image(image_path):
    """Analyse l'image pour décrire la blessure"""
    # Prétraitement
    processed_path = await preprocess_image(image_path)

    # Analyse avec BLIP
    image = Image.open(processed_path).convert('RGB')
    prompt = "Décrivez en détail cette blessure, incluant sa localisation, son apparence, sa taille et sa gravité apparente."

    inputs = processor(image, prompt, return_tensors="pt")
    output = model.generate(**inputs, max_new_tokens=100)
    description = processor.decode(output[0], skip_special_tokens=True)

    # Ajouter un avertissement
    description += "\n\nAttention: Cette description est générée automatiquement et ne remplace pas l'avis d'un professionnel de santé."

    return description