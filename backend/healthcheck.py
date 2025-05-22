#!/usr/bin/env python3
import requests
import sys

def check_health():
    try:
        response = requests.get("http://localhost:8000/", timeout=10)
        if response.status_code == 200:
            print("Service is healthy")
            sys.exit(0)
        else:
            print(f"Service returned status code: {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"Health check failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    check_health()