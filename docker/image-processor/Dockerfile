FROM python:3.10-slim

WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de dépendances
COPY requirements.processor.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.processor.txt

# Copie du code source
COPY . .

# Commande de démarrage
CMD ["python", "-m", "app.services.image_processor.worker"]