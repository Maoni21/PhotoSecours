FROM python:3.10-slim

WORKDIR /app

# Installer les dépendances système pour OpenCV et autres
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY requirements.txt .

# Installer les dépendances avec optimisations pour les modèles IA
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Précharger les modèles BLIP pour éviter le téléchargement au runtime
RUN python -c "from transformers import BlipProcessor, BlipForConditionalGeneration; \
    BlipProcessor.from_pretrained('Salesforce/blip-image-captioning-large'); \
    BlipForConditionalGeneration.from_pretrained('Salesforce/blip-image-captioning-large')"

# Copier le code source
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p uploads && chmod 755 uploads

# Ajouter un endpoint de santé
COPY healthcheck.py .

EXPOSE 8000

# Définir les variables d'environnement pour optimiser PyTorch
ENV TOKENIZERS_PARALLELISM=false
ENV OMP_NUM_THREADS=1

# Commande de démarrage avec timeout étendu
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "300", "--workers", "1"]