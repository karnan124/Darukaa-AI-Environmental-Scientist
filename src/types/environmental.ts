export interface LocationContext {
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SoilContext {
  ph: number | null;
  organic_carbon_percent: number | null;
  moisture_percent: number | null;
}

export interface LandContext {
  land_use: string | null;
  crop: string | null;
  cropping_system: string | null;
  habitat_fragmentation: string | null;
}

export interface BiodiversityContext {
  species_richness: string | null;
  habitat_diversity: string | null;
  pollinator_diversity: string | null;
}

export interface ClimateContext {
  temperature_c: number | null;
  rainfall_mm: number | null;
  rainfall_pattern: string | null;
  water_availability: string | null;
}

export interface HumanImpactContext {
  pollution_level: string | null;
  deforestation_pressure: string | null;
}

export interface EnvironmentalContext {
  location: LocationContext;
  soil: SoilContext;
  land: LandContext;
  biodiversity: BiodiversityContext;
  climate: ClimateContext;
  human_impact: HumanImpactContext;
}

export type ScientificKnowledgeDocument = RetrievedEvidence;

export interface RetrievedEvidence {
  id: string;
  title: string;
  source: string;
  organization: string;
  year: number;
  url: string;
  topic: string;
  variables: string[];
  content: string;
  relevance_score?: number;
  why_relevant?: string;
}

export interface EnvironmentalInteraction {
  variables: string[];
  interaction_type: string;
  description: string;
  scientific_basis: string;
  severity_or_importance: 'critical' | 'high' | 'moderate' | 'low';
}

export interface EnvironmentalAssessmentItem {
  metric: string;
  value: string | number;
  status: 'critical' | 'suboptimal' | 'moderate' | 'optimal' | 'unknown';
  interpretation: string;
}

export interface RecommendationEvidence {
  source_title: string;
  organization: string;
  year: number | string;
  url: string;
}

export interface Recommendation {
  id: string;
  action: string;
  why_it_works: string;
  impacted_metrics: string[];
  time_horizon: 'Short term' | 'Medium term' | 'Long term';
  expected_impact: string;
  evidence: RecommendationEvidence;
  confidence: 'High' | 'Medium' | 'Low';
  limitations: string;
}

export interface AnalysisResponse {
  summary: string;
  missing_information: string[];
  clarification_needed: boolean;
  clarification_questions?: string[];
  environmental_assessment: EnvironmentalAssessmentItem[];
  interactions: EnvironmentalInteraction[];
  recommendations: Recommendation[];
  sources: RetrievedEvidence[];
  context_snapshot: EnvironmentalContext;
  active_variables_count: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  structured_input?: Partial<EnvironmentalContext>;
  analysis?: AnalysisResponse;
  is_clarification?: boolean;
  extracted_variables?: string[];
}

export const EMPTY_ENVIRONMENTAL_CONTEXT: EnvironmentalContext = {
  location: {
    region: null,
    latitude: null,
    longitude: null,
  },
  soil: {
    ph: null,
    organic_carbon_percent: null,
    moisture_percent: null,
  },
  land: {
    land_use: null,
    crop: null,
    cropping_system: null,
    habitat_fragmentation: null,
  },
  biodiversity: {
    species_richness: null,
    habitat_diversity: null,
    pollinator_diversity: null,
  },
  climate: {
    temperature_c: null,
    rainfall_mm: null,
    rainfall_pattern: null,
    water_availability: null,
  },
  human_impact: {
    pollution_level: null,
    deforestation_pressure: null,
  },
};
