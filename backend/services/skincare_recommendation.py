# services/skincare_recommendation.py
import logging

logger = logging.getLogger(__name__)

async def generate_skincare_recommendations(analysis_result):
    """Génère des recommandations personnalisées basées sur l'analyse de peau"""

    skin_type = analysis_result.get("skin_type", {}).get("category", "indéterminé")
    problems = analysis_result.get("problems_detected", [])
    skin_condition = analysis_result.get("skin_condition", {}).get("category", "indéterminé")

    recommendations = {
        "routine_steps": [],
        "products_recommended": [],
        "ingredients_to_look_for": [],
        "ingredients_to_avoid": [],
        "lifestyle_tips": [],
        "severity": "normal",
        "consult_dermatologist": False
    }

    # Recommandations de base selon le type de peau
    base_routine = _get_base_routine(skin_type)
    recommendations["routine_steps"] = base_routine

    # Recommandations spécifiques selon les problèmes détectés
    for problem in problems:
        problem_name = problem.get("condition", "")
        confidence = problem.get("confidence", 0)

        if confidence > 0.4:  # Seuil pour recommandations spécifiques
            problem_recs = _get_problem_specific_recommendations(problem_name)

            # Fusionner les recommandations
            recommendations["products_recommended"].extend(problem_recs.get("products", []))
            recommendations["ingredients_to_look_for"].extend(problem_recs.get("ingredients", []))
            recommendations["ingredients_to_avoid"].extend(problem_recs.get("avoid", []))
            recommendations["lifestyle_tips"].extend(problem_recs.get("tips", []))

            # Vérifier si consultation dermato nécessaire
            if problem_recs.get("severity") == "high":
                recommendations["consult_dermatologist"] = True
                recommendations["severity"] = "high"

    # Ajustements selon l'état de la peau
    condition_adjustments = _get_condition_adjustments(skin_condition)
    recommendations["lifestyle_tips"].extend(condition_adjustments)

    # Nettoyer les doublons
    recommendations = _clean_recommendations(recommendations)

    # Ajouter disclaimer
    recommendations["disclaimer"] = "Ces recommandations sont générées par IA à titre informatif. Consultez un dermatologue pour un diagnostic et traitement personnalisés."

    return recommendations

def _get_base_routine(skin_type):
    """Routine de base selon le type de peau"""
    routines = {
        "peau grasse": [
            "Nettoyage matin et soir avec un nettoyant sans huile",
            "Tonique purifiant (acide salicylique BHA)",
            "Sérum niacinamide pour réguler le sébum",
            "Hydratant léger non-comédogène",
            "Protection solaire SPF 30+ le matin"
        ],
        "peau sèche": [
            "Nettoyage doux le soir, eau micellaire le matin",
            "Sérum hydratant (acide hyaluronique)",
            "Crème riche en céramides et beurre de karité",
            "Huile visage le soir si besoin",
            "Protection solaire hydratante SPF 30+ le matin"
        ],
        "peau mixte": [
            "Nettoyage doux matin et soir",
            "Tonique doux 2-3x/semaine",
            "Sérum hydratant sur joues, sérum matifiant sur zone T",
            "Hydratant adapté par zones",
            "Protection solaire SPF 30+ le matin"
        ],
        "peau normale": [
            "Nettoyage doux matin et soir",
            "Sérum antioxydant (vitamine C le matin)",
            "Hydratant quotidien",
            "Exfoliation douce 1-2x/semaine",
            "Protection solaire SPF 30+ le matin"
        ],
        "peau sensible": [
            "Nettoyage très doux sans parfum",
            "Produits hypoallergéniques uniquement",
            "Hydratant apaisant (aloe vera, avoine)",
            "Éviter les actifs forts",
            "Protection solaire minérale SPF 30+"
        ]
    }

    return routines.get(skin_type, routines["peau normale"])

def _get_problem_specific_recommendations(problem):
    """Recommandations spécifiques par problème"""
    problem_recs = {
        "acné": {
            "products": [
                "Nettoyant acide salicylique (BHA)",
                "Sérum niacinamide 10%",
                "Traitement localisé peroxyde de benzoyle 2.5%"
            ],
            "ingredients": ["acide salicylique", "niacinamide", "peroxyde de benzoyle", "zinc"],
            "avoid": ["huiles comédogènes", "alcool dénaturé", "parfums forts"],
            "tips": [
                "Ne pas percer les boutons",
                "Changer la taie d'oreiller régulièrement",
                "Nettoyer le téléphone quotidiennement"
            ],
            "severity": "medium"
        },
        "points noirs": {
            "products": [
                "Masque à l'argile 1-2x/semaine",
                "Sérum BHA (acide salicylique)",
                "Patchs anti-points noirs"
            ],
            "ingredients": ["acide salicylique", "argile bentonite", "charbon actif"],
            "avoid": ["over-nettoyage", "grattage excessif"],
            "tips": ["Vapeur faciale avant extraction", "Hydrater après traitement"],
            "severity": "low"
        },
        "rides": {
            "products": [
                "Sérum rétinol (commencer progressivement)",
                "Crème peptides",
                "Sérum vitamine C antioxydant"
            ],
            "ingredients": ["rétinol", "acide hyaluronique", "peptides", "vitamine C"],
            "avoid": ["exposition solaire sans protection"],
            "tips": [
                "Commencer le rétinol 1x/semaine",
                "Toujours utiliser protection solaire",
                "Dormir sur le dos si possible"
            ],
            "severity": "low"
        },
        "taches brunes": {
            "products": [
                "Sérum vitamine C le matin",
                "Sérum acides de fruits (AHA) le soir",
                "Crème dépigmentante"
            ],
            "ingredients": ["vitamine C", "arbutine", "kojique acide", "acide glycolique"],
            "avoid": ["exposition solaire", "parfums photosensibilisants"],
            "tips": [
                "Protection solaire OBLIGATOIRE",
                "Patience - résultats en 2-3 mois",
                "Éviter manipulation des taches"
            ],
            "severity": "medium"
        },
        "rougeurs": {
            "products": [
                "Nettoyant très doux sans sulfates",
                "Sérum apaisant centella asiatica",
                "Crème anti-rougeurs"
            ],
            "ingredients": ["niacinamide", "centella asiatica", "allantoïne", "bisabolol"],
            "avoid": ["alcool", "parfums", "menthol", "actifs irritants"],
            "tips": [
                "Éviter eau trop chaude",
                "Protéger du vent et froid",
                "Identifier les déclencheurs"
            ],
            "severity": "medium"
        },
        "pores dilatés": {
            "products": [
                "Sérum niacinamide",
                "Tonique BHA léger",
                "Masque argile 1x/semaine"
            ],
            "ingredients": ["niacinamide", "acide salicylique", "argile"],
            "avoid": ["over-nettoyage", "products comedogènes"],
            "tips": [
                "Ne pas presser les pores",
                "Hydrater malgré peau grasse",
                "Primer matifiant avant maquillage"
            ],
            "severity": "low"
        }
    }

    return problem_recs.get(problem, {
        "products": [], "ingredients": [], "avoid": [], "tips": [], "severity": "low"
    })

def _get_condition_adjustments(condition):
    """Ajustements selon l'état général de la peau"""
    adjustments = {
        "peau terne": [
            "Exfoliation douce 2x/semaine",
            "Masque éclat 1x/semaine",
            "Augmenter hydratation"
        ],
        "peau fatiguée": [
            "Sérum énergisant (caféine)",
            "Masque hydratant overnight",
            "Dormir 7-8h par nuit"
        ],
        "peau rugueuse": [
            "Exfoliation enzymatique",
            "Sérum lissant (urée)",
            "Hydratation renforcée"
        ]
    }

    return adjustments.get(condition, [])

def _clean_recommendations(recommendations):
    """Nettoie les doublons dans les recommandations"""
    for key in ["products_recommended", "ingredients_to_look_for", "ingredients_to_avoid", "lifestyle_tips"]:
        if key in recommendations:
            # Supprimer doublons en gardant l'ordre
            seen = set()
            recommendations[key] = [x for x in recommendations[key] if not (x in seen or seen.add(x))]

    return recommendations