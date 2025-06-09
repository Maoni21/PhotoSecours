#!/usr/bin/env python3
import requests
import sys
import time

def check_health():
    """Vérifie que l'API SkinCare AI répond correctement"""
    max_retries = 3

    for attempt in range(max_retries):
        try:
            print(f"Tentative {attempt + 1}/{max_retries} de vérification de santé...")

            # Test endpoint racine
            response = requests.get("http://localhost:8000/", timeout=10)

            if response.status_code == 200:
                print("✅ Service SkinCare AI en bonne santé")

                # Test optionnel endpoint health
                try:
                    health_response = requests.get("http://localhost:8000/health", timeout=5)
                    if health_response.status_code == 200:
                        health_data = health_response.json()
                        print(f"✅ Status: {health_data.get('status', 'unknown')}")
                        print(f"✅ Services: {health_data.get('services', [])}")
                except:
                    pass  # Endpoint health optionnel

                sys.exit(0)
            else:
                print(f"❌ Service retourne le code: {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"❌ Impossible de se connecter au service (tentative {attempt + 1})")
        except requests.exceptions.Timeout:
            print(f"❌ Timeout lors de la connexion (tentative {attempt + 1})")
        except Exception as e:
            print(f"❌ Erreur healthcheck: {e}")

        if attempt < max_retries - 1:
            print("⏳ Attente avant nouvelle tentative...")
            time.sleep(2)

    print("❌ Échec du healthcheck après toutes les tentatives")
    sys.exit(1)

if __name__ == "__main__":
    check_health()