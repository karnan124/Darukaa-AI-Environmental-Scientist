from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class LocationContext(BaseModel):
    region: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class SoilContext(BaseModel):
    ph: Optional[float] = None
    organic_carbon_percent: Optional[float] = None
    moisture_percent: Optional[float] = None

class LandContext(BaseModel):
    land_use: Optional[str] = None
    crop: Optional[str] = None
    cropping_system: Optional[str] = None
    habitat_fragmentation: Optional[str] = None

class BiodiversityContext(BaseModel):
    species_richness: Optional[str] = None
    habitat_diversity: Optional[str] = None
    pollinator_diversity: Optional[str] = None

class ClimateContext(BaseModel):
    temperature_c: Optional[float] = None
    rainfall_mm: Optional[float] = None
    rainfall_pattern: Optional[str] = None
    water_availability: Optional[str] = None

class HumanImpactContext(BaseModel):
    pollution_level: Optional[str] = None
    deforestation_pressure: Optional[str] = None

class EnvironmentalContext(BaseModel):
    location: LocationContext = Field(default_factory=LocationContext)
    soil: SoilContext = Field(default_factory=SoilContext)
    land: LandContext = Field(default_factory=LandContext)
    biodiversity: BiodiversityContext = Field(default_factory=BiodiversityContext)
    climate: ClimateContext = Field(default_factory=ClimateContext)
    human_impact: HumanImpactContext = Field(default_factory=HumanImpactContext)

class EvidenceSource(BaseModel):
    source_title: str
    organization: str
    year: int | str
    url: str

class Recommendation(BaseModel):
    id: str
    action: str
    why_it_works: str
    impacted_metrics: List[str]
    time_horizon: str
    expected_impact: str
    evidence: EvidenceSource
    confidence: str
    limitations: str

class EnvironmentalAssessmentItem(BaseModel):
    metric: str
    value: Any
    status: str
    interpretation: str

class EnvironmentalInteraction(BaseModel):
    variables: List[str]
    interaction_type: str
    description: str
    scientific_basis: str
    severity_or_importance: str

class AnalysisOutput(BaseModel):
    summary: str
    missing_information: List[str] = []
    clarification_needed: bool = False
    clarification_questions: List[str] = []
    environmental_assessment: List[EnvironmentalAssessmentItem] = []
    interactions: List[EnvironmentalInteraction] = []
    recommendations: List[Recommendation] = []
    sources: List[Dict[str, Any]] = []
    context_snapshot: EnvironmentalContext
    active_variables_count: int = 0
