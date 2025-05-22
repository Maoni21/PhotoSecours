FROM python:3.9-slim

WORKDIR /app

# Installer les dépendances système pour OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Installer les dépendances avec un timeout plus long
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Créer le dossier uploads s'il n'existe pas
RUN mkdir -p uploads

EXPOSE 8000

# Augmenter le timeout pour uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "120"]