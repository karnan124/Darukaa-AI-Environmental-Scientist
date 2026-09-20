import { GoogleGenAI, Type } from '@google/genai';
import type { EnvironmentalContext } from '../src/types/environmental.js';
import { EMPTY_ENVIRONMENTAL_CONTEXT } from '../src/types/environmental.js';

export interface ExtractionResult {
  context: Partial<EnvironmentalContext>;
  extractedFields: string[];
}

export class NaturalLanguageExtractor {
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      this.ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  public async extract(text: string): Promise<ExtractionResult> {
    const extractedFields: string[] = [];
    const ruleBasedContext = this.extractRuleBased(text, extractedFields);

    // If Gemini is configured, use it to augment or refine extraction
    if (this.ai && text.length > 15) {
      try {
        const geminiResult = await this.extractWithGemini(text);
        // Merge geminiResult into ruleBasedContext
        return this.mergeExtractions(ruleBasedContext, geminiResult.context, extractedFields, geminiResult.extractedFields);
      } catch (err: any) {
        // Fall back gracefully to the rule-based extractor
        if (process.env.DEBUG) {
          console.warn('Gemini extraction fallback:', err?.message || err);
        }
      }
    }

    return {
      context: ruleBasedContext,
      extractedFields: Array.from(new Set(extractedFields)),
    };
  }

  private extractRuleBased(text: string, fields: string[]): Partial<EnvironmentalContext> {
    const lower = text.toLowerCase();
    const result: EnvironmentalContext = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));

    // 1. Soil Organic Carbon
    // Matches: 0.3%, 0.3 percent, soc is 0.3, carbon 0.4%
    const socMatch = text.match(/(?:soil\s+(?:organic\s+)?carbon|soc|organic\s+carbon)\s*(?:is|of|level)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i) ||
                     text.match(/([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:soil\s+(?:organic\s+)?carbon|soc|organic\s+carbon)/i) ||
                     text.match(/(?:organic\s+carbon|soc)\s*(?:is|=)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (socMatch) {
      result.soil!.organic_carbon_percent = parseFloat(socMatch[1]);
      fields.push('soil.organic_carbon_percent');
    }

    // 2. Soil pH
    const phMatch = text.match(/(?:soil\s+)?ph\s*(?:is|of|level)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (phMatch) {
      result.soil!.ph = parseFloat(phMatch[1]);
      fields.push('soil.ph');
    }

    // 3. Soil Moisture
    const moistureMatch = text.match(/(?:soil\s+)?moisture\s*(?:is|of|level)?\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)\s*%/i);
    if (moistureMatch) {
      result.soil!.moisture_percent = parseFloat(moistureMatch[1]);
      fields.push('soil.moisture_percent');
    } else if (lower.includes('dry soil') || lower.includes('low soil moisture')) {
      result.soil!.moisture_percent = 8.0;
      fields.push('soil.moisture_percent');
    }

    // 4. Land & Cropping System
    if (lower.includes('monoculture')) {
      result.land!.cropping_system = 'monoculture';
      fields.push('land.cropping_system');
    } else if (lower.includes('intercropping') || lower.includes('intercropped')) {
      result.land!.cropping_system = 'intercropping';
      fields.push('land.cropping_system');
    } else if (lower.includes('agroforestry')) {
      result.land!.cropping_system = 'agroforestry';
      fields.push('land.cropping_system');
    }

    // Crops
    const crops = ['wheat', 'barley', 'corn', 'maize', 'soybean', 'rice', 'cotton', 'canola', 'sorghum', 'millet', 'chickpea', 'lentil'];
    for (const crop of crops) {
      if (lower.includes(crop)) {
        result.land!.crop = crop;
        fields.push('land.crop');
        break;
      }
    }

    // Land use
    if (lower.includes('agricultural') || lower.includes('farm') || lower.includes('cropland')) {
      result.land!.land_use = 'agricultural';
      fields.push('land.land_use');
    } else if (lower.includes('forest')) {
      result.land!.land_use = 'forest';
      fields.push('land.land_use');
    } else if (lower.includes('grassland')) {
      result.land!.land_use = 'grassland';
      fields.push('land.land_use');
    }

    // Habitat fragmentation
    if (lower.includes('fragmented') || lower.includes('fragmentation')) {
      result.land!.habitat_fragmentation = lower.includes('high') || lower.includes('severe') ? 'high' : 'moderate';
      fields.push('land.habitat_fragmentation');
    }

    // 5. Climate: Rainfall & Region
    if (lower.includes('semi-arid') || lower.includes('semi arid')) {
      result.location!.region = 'semi-arid';
      fields.push('location.region');
    } else if (lower.includes('arid')) {
      result.location!.region = 'arid';
      fields.push('location.region');
    } else if (lower.includes('sub-humid') || lower.includes('subhumid')) {
      result.location!.region = 'sub-humid';
      fields.push('location.region');
    } else if (lower.includes('tropical')) {
      result.location!.region = 'tropical';
      fields.push('location.region');
    } else if (lower.includes('temperate')) {
      result.location!.region = 'temperate';
      fields.push('location.region');
    }

    // Rainfall pattern
    if (lower.includes('rainfall is low') || lower.includes('low rainfall') || lower.includes('sparse rainfall') || lower.includes('minimal rain')) {
      result.climate!.rainfall_pattern = 'low';
      result.climate!.water_availability = 'scarce';
      fields.push('climate.rainfall_pattern');
      fields.push('climate.water_availability');
    } else if (lower.includes('erratic rainfall') || lower.includes('unreliable rain')) {
      result.climate!.rainfall_pattern = 'erratic';
      fields.push('climate.rainfall_pattern');
    } else if (lower.includes('high rainfall') || lower.includes('heavy rain')) {
      result.climate!.rainfall_pattern = 'high';
      fields.push('climate.rainfall_pattern');
    }

    // Rainfall mm
    const rainfallMmMatch = text.match(/([0-9]+)\s*(?:mm|millimeters)\s*(?:of\s+rainfall|rain|annual)?/i);
    if (rainfallMmMatch) {
      result.climate!.rainfall_mm = parseInt(rainfallMmMatch[1], 10);
      fields.push('climate.rainfall_mm');
    }

    // 6. Biodiversity Indicators
    if (lower.includes('biodiversity is declining') || lower.includes('declining biodiversity') || lower.includes('biodiversity loss') || lower.includes('low biodiversity')) {
      result.biodiversity!.species_richness = 'declining/low';
      result.biodiversity!.habitat_diversity = 'low';
      fields.push('biodiversity.species_richness');
      fields.push('biodiversity.habitat_diversity');
    }
    if (lower.includes('pollinator') && (lower.includes('decline') || lower.includes('few') || lower.includes('low'))) {
      result.biodiversity!.pollinator_diversity = 'low';
      fields.push('biodiversity.pollinator_diversity');
    }

    // 7. Human impact
    if (lower.includes('pesticide') || lower.includes('fertilizer run-off') || lower.includes('pollution')) {
      result.human_impact!.pollution_level = lower.includes('high') ? 'high' : 'moderate';
      fields.push('human_impact.pollution_level');
    }
    if (lower.includes('deforestation') || lower.includes('cleared forest')) {
      result.human_impact!.deforestation_pressure = 'high';
      fields.push('human_impact.deforestation_pressure');
    }

    return result;
  }

  private async extractWithGemini(text: string): Promise<ExtractionResult> {
    if (!this.ai) return { context: {}, extractedFields: [] };

    const prompt = `Extract all mentioned environmental, soil, land use, biodiversity, climate, and human impact metrics from this user statement into JSON:
"${text}"
Only output valid JSON matching the environmental fields. If a variable is not mentioned, use null.`;

    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  region: { type: Type.STRING },
                  soil_organic_carbon_percent: { type: Type.NUMBER },
                  soil_ph: { type: Type.NUMBER },
                  soil_moisture_percent: { type: Type.NUMBER },
                  land_use: { type: Type.STRING },
                  crop: { type: Type.STRING },
                  cropping_system: { type: Type.STRING },
                  habitat_fragmentation: { type: Type.STRING },
                  species_richness: { type: Type.STRING },
                  habitat_diversity: { type: Type.STRING },
                  pollinator_diversity: { type: Type.STRING },
                  rainfall_pattern: { type: Type.STRING },
                  rainfall_mm: { type: Type.NUMBER },
                  water_availability: { type: Type.STRING },
                  pollution_level: { type: Type.STRING },
                  deforestation_pressure: { type: Type.STRING },
                },
              },
            },
          });

          const parsed = JSON.parse(response.text?.trim() || '{}');
          const context: EnvironmentalContext = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
          const extractedFields: string[] = [];

          if (parsed.region) { context.location.region = parsed.region; extractedFields.push('location.region'); }
          if (parsed.soil_organic_carbon_percent !== undefined && parsed.soil_organic_carbon_percent !== null) {
            context.soil.organic_carbon_percent = parsed.soil_organic_carbon_percent;
            extractedFields.push('soil.organic_carbon_percent');
          }
          if (parsed.soil_ph !== undefined && parsed.soil_ph !== null) {
            context.soil.ph = parsed.soil_ph;
            extractedFields.push('soil.ph');
          }
          if (parsed.soil_moisture_percent !== undefined && parsed.soil_moisture_percent !== null) {
            context.soil.moisture_percent = parsed.soil_moisture_percent;
            extractedFields.push('soil.moisture_percent');
          }
          if (parsed.crop) { context.land.crop = parsed.crop; extractedFields.push('land.crop'); }
          if (parsed.cropping_system) { context.land.cropping_system = parsed.cropping_system; extractedFields.push('land.cropping_system'); }
          if (parsed.land_use) { context.land.land_use = parsed.land_use; extractedFields.push('land.land_use'); }
          if (parsed.habitat_fragmentation) { context.land.habitat_fragmentation = parsed.habitat_fragmentation; extractedFields.push('land.habitat_fragmentation'); }
          if (parsed.species_richness) { context.biodiversity.species_richness = parsed.species_richness; extractedFields.push('biodiversity.species_richness'); }
          if (parsed.pollinator_diversity) { context.biodiversity.pollinator_diversity = parsed.pollinator_diversity; extractedFields.push('biodiversity.pollinator_diversity'); }
          if (parsed.rainfall_pattern) { context.climate.rainfall_pattern = parsed.rainfall_pattern; extractedFields.push('climate.rainfall_pattern'); }
          if (parsed.water_availability) { context.climate.water_availability = parsed.water_availability; extractedFields.push('climate.water_availability'); }
          if (parsed.rainfall_mm !== undefined && parsed.rainfall_mm !== null) { context.climate.rainfall_mm = parsed.rainfall_mm; extractedFields.push('climate.rainfall_mm'); }
          if (parsed.pollution_level) { context.human_impact.pollution_level = parsed.pollution_level; extractedFields.push('human_impact.pollution_level'); }
          if (parsed.deforestation_pressure) { context.human_impact.deforestation_pressure = parsed.deforestation_pressure; extractedFields.push('human_impact.deforestation_pressure'); }

          return { context, extractedFields };
        } catch (err: any) {
          lastError = err;
          // If 503 or 429 rate/demand limit, wait briefly before retrying
          if (err?.status === 503 || err?.status === 429 || err?.message?.includes('503') || err?.message?.includes('high demand')) {
            await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
            continue;
          }
          // Non-transient error for this model, try next model
          break;
        }
      }
    }

    throw lastError || new Error('All Gemini extraction models failed');
  }

  private mergeExtractions(
    base: Partial<EnvironmentalContext>,
    gemini: Partial<EnvironmentalContext>,
    fieldsA: string[],
    fieldsB: string[]
  ): ExtractionResult {
    const merged: EnvironmentalContext = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
    Object.assign(merged.location, base.location, gemini.location);
    Object.assign(merged.soil, base.soil, gemini.soil);
    Object.assign(merged.land, base.land, gemini.land);
    Object.assign(merged.biodiversity, base.biodiversity, gemini.biodiversity);
    Object.assign(merged.climate, base.climate, gemini.climate);
    Object.assign(merged.human_impact, base.human_impact, gemini.human_impact);

    return {
      context: merged,
      extractedFields: Array.from(new Set([...fieldsA, ...fieldsB])),
    };
  }
}

export const naturalLanguageExtractor = new NaturalLanguageExtractor();
