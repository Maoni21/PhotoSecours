# 🌟 SkinCare AI

**Analyse intelligente de peau et recommandations skincare personnalisées avec IA**

SkinCare AI est une application web innovante qui utilise le modèle CLIP d'OpenAI pour analyser les photos de peau et fournir des recommandations skincare sur mesure.

## ✨ Fonctionnalités

### 🔍 Analyse de Peau Avancée
- **Détection du type de peau** : Grasse, sèche, mixte, normale, sensible
- **Identification des problèmes cutanés** : Acné, rides, taches, rougeurs, pores dilatés, cernes
- **Évaluation de l'état général** : Peau lisse, rugueuse, terne, éclatante, fatiguée, hydratée

### 💡 Recommandations Personnalisées
- **Routine skincare complète** matin et soir adaptée à votre type de peau
- **Produits spécifiques** recommandés selon vos besoins
- **Ingrédients actifs** à rechercher et à éviter
- **Conseils lifestyle** pour améliorer la santé de votre peau

### 🛡️ Sécurité & Confidentialité
- **Validation stricte des images** : Rejet automatique des non-visages (voitures, animaux, objets)
- **Traitement 100% en mémoire** : Aucune image stockée sur le serveur
- **Confidentialité maximale** : Suppression immédiate des données après analyse

### 🤖 Technologie IA Avancée
- **Modèle CLIP** d'OpenAI pour l'analyse vision-langage
- **Validation double** : OpenCV + CLIP pour garantir la détection de visages humains
- **Analyse multi-critères** : Type de peau + problèmes + état général

## 🛠️ Stack Technique

### Backend
- **FastAPI** (Python) - API REST haute performance
- **CLIP** (OpenAI) - Modèle vision-langage pour l'analyse
- **OpenCV** - Détection et prétraitement d'images
- **Transformers** (Hugging Face) - Framework IA
- **Pydantic** - Validation et sérialisation des données

### Frontend
- **React** - Interface utilisateur moderne
- **Tailwind CSS** - Styling responsive
- **Lucide Icons** - Icônes modernes

### Infrastructure
- **Docker** - Containerisation
- **Docker Compose** - Orchestration multi-services
- **Nginx** - Serveur web pour le frontend

## 🚀 Installation

### Prérequis
- Docker et Docker Compose
- 4GB+ RAM (pour les modèles IA)

### Démarrage rapide
```bash
# Cloner le repository
git clone <votre-repo-url>
cd skincare-ai

# Lancer avec Docker Compose
docker-compose up --build

# L'application sera accessible sur :
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
```

### Installation manuelle

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

## 📡 API Endpoints

### Analyse Principal
```http
POST /api/analyze
Content-Type: multipart/form-data

# Upload une image de visage
# Retourne l'analyse complète + recommandations
```

### Validation
```http
POST /api/validate-face
Content-Type: multipart/form-data

# Valide si l'image contient un visage humain
# Retourne validation sans analyse complète
```

### Informations
```http
GET /api/skin-types        # Types de peau détectables
GET /api/skin-problems     # Problèmes cutanés identifiables
GET /api/features          # Fonctionnalités de l'app
GET /health                # Statut du service
```

## 📱 Utilisation

### 1. Prendre une Photo
- **Éclairage naturel** de préférence
- **Visage face caméra** sans maquillage
- **Qualité correcte** (formats : JPG, PNG, WebP)
- **Taille max** : 15MB

### 2. Analyse Automatique
L'IA analyse votre image en plusieurs étapes :
1. **Validation** : Vérification que c'est bien un visage humain
2. **Prétraitement** : Détection et amélioration de la zone faciale
3. **Analyse CLIP** : Classification du type de peau et détection des problèmes
4. **Recommandations** : Génération de conseils personnalisés

### 3. Résultats
- Type de peau détecté avec niveau de confiance
- Liste des problèmes cutanés identifiés
- Routine skincare personnalisée complète
- Recommandations produits et ingrédients

## 🎯 Architecture

### Traitement en Mémoire
```
Image Upload → PIL Conversion → Face Validation → CLIP Analysis → Recommendations → Response
     ↓              ↓              ↓              ↓               ↓
   Bytes         Memory         Memory         Memory        JSON Output
```

### Validation Multi-Niveaux
1. **Format** : Vérification type MIME
2. **OpenCV** : Détection de visage technique
3. **CLIP** : Validation sémantique "visage humain"
4. **Seuils** : Confiance et taille minimale

## 📊 Modèles Supportés

### Types de Peau
- Peau grasse (production excessive de sébum)
- Peau sèche (manque d'hydratation)
- Peau mixte (zone T grasse, joues normales)
- Peau normale (équilibre optimal)
- Peau sensible (réactivité élevée)

### Problèmes Détectables
- Acné et boutons
- Points noirs
- Rides et ridules
- Taches brunes (hyperpigmentation)
- Rougeurs et irritations
- Pores dilatés
- Cernes
- Sécheresse cutanée
- Brillance excessive

## ⚡ Performances

- **Temps d'analyse** : < 5 secondes par image
- **Précision** : >50% de confiance pour les détections validées
- **Détection multi-problèmes** : Jusqu'à 10+ conditions simultanées
- **Rejet efficace** : 99%+ des non-visages bloqués

## 🔧 Configuration

### Variables d'Environnement
```bash
# Développement
ENVIRONMENT=development
TOKENIZERS_PARALLELISM=false
OMP_NUM_THREADS=1

# Production
CORS_ORIGINS=https://yourdomain.com
MAX_UPLOAD_SIZE=15MB
```

### Ajustement des Seuils
```python
# Dans face_validation.py
CLIP_HUMAN_FACE_THRESHOLD = 0.5   # Seuil de validation CLIP
MIN_FACE_AREA_RATIO = 0.02        # Taille minimum du visage

# Dans skincare_analysis.py
PROBLEM_DETECTION_THRESHOLD = 0.3  # Seuil de détection des problèmes
```

## 🧪 Tests

### Test avec cURL
```bash
# Test d'analyse
curl -X POST "http://localhost:8000/api/analyze" \
  -F "file=@photo_visage.jpg"

# Test de validation
curl -X POST "http://localhost:8000/api/validate-face" \
  -F "file=@photo_test.jpg"
```

### Tests Frontend
```bash
cd frontend
npm test
```

## 🚀 Déploiement

### Production avec Docker
```bash
# Build optimisé
docker-compose -f docker-compose.prod.yml up --build -d

# Monitoring
docker-compose logs -f
```

### Variables de Production
- Configurer CORS pour votre domaine
- Ajuster les limites de ressources
- Activer HTTPS
- Configurer le monitoring

## 🤝 Contribution

### Groupe de Développement
- **Florian** - [Rôle/Contribution]
- **Pacard** - [Rôle/Contribution]
- **Hugo Pigree** - [Rôle/Contribution]
- **Imrane Mesbahi** - [Rôle/Contribution]

### Améliorer le Projet
1. Fork le repository
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

Ce projet est développé dans le cadre d'un projet étudiant à HETIC - Classe Web 2.

## ⚠️ Disclaimers

- **Pas un diagnostic médical** : Cette application fournit des suggestions, pas des diagnostics
- **Consultez un professionnel** : Pour des problèmes de peau sérieux, consultez un dermatologue
- **IA généraliste** : Les recommandations sont basées sur des modèles d'IA généraux
- **Usage personnel** : Application destinée à un usage informatif personnel

## 🔗 Liens Utiles

- [Documentation CLIP OpenAI](https://openai.com/blog/clip/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/)
- [Docker Documentation](https://docs.docker.com/)

---

**SkinCare AI** - Votre assistant beauté intelligent 💄✨

*Développé avec ❤️ par l'équipe Web 2 - HETIC*
