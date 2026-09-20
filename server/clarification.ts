import type { EnvironmentalContext } from '../src/types/environmental.js';

export interface ClarificationCheckResult {
  needsClarification: boolean;
  missingVariables: string[];
  reasons: string[];
  questions: string[];
}

export class ClarificationDetector {
  /**
   * Analyzes the active environmental context and user query to determine if
   * critical variables are missing for sound scientific recommendations.
   */
  public evaluate(context: EnvironmentalContext, query: string, forceAnalyze = false): ClarificationCheckResult {
    if (forceAnalyze) {
      return {
        needsClarification: false,
        missingVariables: [],
        reasons: [],
        questions: [],
      };
    }

    const missingVariables: string[] = [];
    const reasons: string[] = [];
    const questions: string[] = [];

    // Count present variables across pillars
    let hasSoil = context.soil.organic_carbon_percent !== null || context.soil.ph !== null || context.soil.moisture_percent !== null;
    let hasLand = context.land.crop !== null || context.land.cropping_system !== null || context.land.land_use !== null;
    let hasClimate = context.climate.rainfall_pattern !== null || context.climate.rainfall_mm !== null || context.location.region !== null || context.climate.water_availability !== null;
    let hasBiodiversity = context.biodiversity.species_richness !== null || context.biodiversity.pollinator_diversity !== null || context.biodiversity.habitat_diversity !== null;

    const lowerQuery = query.toLowerCase();

    // Check if query is high-level/vague (e.g. "my biodiversity is declining", "soil is poor", "help my farm")
    const isVagueInquiry = 
      (lowerQuery.includes('biodiversity is declining') || lowerQuery.includes('how to improve biodiversity') || lowerQuery.includes('my soil is bad')) &&
      !hasSoil && !hasClimate;

    // 1. Check Land Use / Cropping System
    if (!context.land.crop && !context.land.cropping_system && !context.land.land_use) {
      missingVariables.push('land.crop_and_system');
      reasons.push('Cropping regime (e.g. monoculture, rotation) dictates habitat structure and floral resource gaps.');
      questions.push('What crop or vegetation is currently cultivated, and is it managed as a monoculture or rotated system?');
    }

    // 2. Check Soil Baseline
    if (context.soil.organic_carbon_percent === null && context.soil.ph === null && context.soil.moisture_percent === null) {
      missingVariables.push('soil.organic_carbon_percent');
      reasons.push('Soil organic carbon is the master chemical and physical indicator of water retention and microbial activity.');
      questions.push('What is the approximate soil organic carbon (SOC) percentage or general soil health condition?');
    }

    // 3. Check Climate / Hydrological Regime
    if (!context.climate.rainfall_pattern && context.climate.rainfall_mm === null && !context.location.region) {
      missingVariables.push('climate.rainfall_pattern');
      reasons.push('Moisture availability determines viable ecological interventions (e.g. drought-tolerant cover crops vs moisture-demanding agroforestry).');
      questions.push('What is the typical rainfall regime or bioclimatic zone (e.g., semi-arid, temperate, tropical)?');
    }

    // 4. Specific checks if user talks about biodiversity but mentions nothing about disturbance
    if (lowerQuery.includes('biodiversity') && context.human_impact.pollution_level === null && context.human_impact.deforestation_pressure === null && context.land.habitat_fragmentation === null) {
      if (missingVariables.length < 3) {
        missingVariables.push('land.habitat_fragmentation');
        reasons.push('Landscape connectivity and field borders heavily influence species dispersion.');
        questions.push('Are there existing semi-natural habitat corridors, hedgerows, or nearby forest patches, or is the surrounding landscape highly fragmented?');
      }
    }

    // Decide if clarification is strictly required
    // If fewer than 2 pillars are populated, or if the user asked a vague query, we MUST clarify.
    const populatedPillarsCount = [hasSoil, hasLand, hasClimate, hasBiodiversity].filter(Boolean).length;
    const needsClarification = populatedPillarsCount < 2 || (isVagueInquiry && populatedPillarsCount < 3);

    return {
      needsClarification,
      missingVariables,
      reasons,
      questions: questions.slice(0, 3), // Return the top 3 most critical questions to avoid overwhelming user
    };
  }
}

export const clarificationDetector = new ClarificationDetector();
