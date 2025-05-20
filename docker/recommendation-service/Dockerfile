FROM python:3.10-slim

WORKDIR /app

# Copie des fichiers de dépendances
COPY requirements.recommendation.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.recommendation.txt

# Copie du code source
COPY . .

# Commande de démarrage
CMD ["python", "-m", "app.services.recommendation.worker"]