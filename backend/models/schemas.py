# models/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class Recommendation(BaseModel):
    steps: List[str]
    severity: str
    seek_medical_help: bool
    disclaimer: str

class AnalysisResponse(BaseModel):
    id: str
    description: str
    recommendations: Recommendation
    severity_level: str