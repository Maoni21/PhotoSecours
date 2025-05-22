# services/recommendation.py
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

async def generate_recommendations(description):
    """Génère des recommandations de premiers soins basées sur la description"""

    # Pour une version simple, nous utiliserons un ensemble de règles basiques
    # Dans une version avancée, vous utiliseriez un modèle de langage

    recommendations = {
        "steps": [],
        "severity": "medium",
        "seek_medical_help": False
    }

    # Mots-clés pour déterminer la gravité
    high_severity_keywords = ["profonde", "saignement abondant", "grave", "sévère", "fracture",
                              "os visible", "déformation", "inconscient"]
    medium_severity_keywords = ["coupure", "entaille", "saignement", "brûlure", "modérée"]

    # Vérifier la gravité
    description_lower = description.lower()
    severity = "low"

    for word in high_severity_keywords:
        if word in description_lower:
            severity = "high"
            recommendations["seek_medical_help"] = True
            break

    if severity != "high":
        for word in medium_severity_keywords:
            if word in description_lower:
                severity = "medium"
                break

    recommendations["severity"] = severity

    # Recommandations basiques selon le type de blessure
    if "coupure" in description_lower or "entaille" in description_lower:
        recommendations["steps"] = [
            "Nettoyez la plaie avec de l'eau propre et du savon doux",
            "Appliquez une pression directe avec un bandage propre pour arrêter le saignement",
            "Désinfectez avec un antiseptique",
            "Couvrez avec un pansement stérile"
        ]
    elif "brûlure" in description_lower:
        recommendations["steps"] = [
            "Refroidissez la zone brûlée sous l'eau froide pendant 10-15 minutes",
            "N'appliquez pas de glace directement sur la brûlure",
            "Couvrez avec un bandage propre et non adhérent",
            "Ne percez pas les cloques"
        ]
    elif "fracture" in description_lower:
        recommendations["steps"] = [
            "Ne déplacez pas la zone blessée",
            "Immobilisez la zone avec une attelle improvisée si possible",
            "Appliquez de la glace enveloppée dans un tissu pour réduire le gonflement",
            "Consultez immédiatement un médecin"
        ]
        recommendations["seek_medical_help"] = True
    else:
        recommendations["steps"] = [
            "Nettoyez doucement la zone affectée",
            "Appliquez un antiseptique si disponible",
            "Couvrez avec un pansement propre",
            "Surveillez l'évolution de la blessure"
        ]

    # Ajouter un avertissement
    recommendations["disclaimer"] = "Ces recommandations sont générées automatiquement et ne remplacent pas l'avis d'un professionnel de santé. En cas de doute, consultez un médecin."

    return recommendations