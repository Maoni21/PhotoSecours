FROM python:3.10-slim

WORKDIR /app

# Variables d'environnement pour optimiser PyTorch
ENV TOKENIZERS_PARALLELISM=false
ENV OMP_NUM_THREADS=1
ENV PYTHONUNBUFFERED=1

# Installer les dépendances système pour OpenCV
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

# Installer les dépendances avec optimisations
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# ✅ CORRIGÉ - Précharger CLIP au lieu de BLIP
RUN python -c "from transformers import CLIPProcessor, CLIPModel; \
    CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32'); \
    CLIPModel.from_pretrained('openai/clip-vit-base-patch32'); \
    print('✅ Modèle CLIP préchargé avec succès')"

# Copier le code source
COPY . .

# ✅ CORRIGÉ - Plus besoin de dossier uploads (traitement en mémoire)
# RUN mkdir -p uploads && chmod 755 uploads

# Ajouter healthcheck
COPY healthcheck.py .

EXPOSE 8000

# Commande de démarrage optimisée pour SkinCare AI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "300", "--workers", "1"]