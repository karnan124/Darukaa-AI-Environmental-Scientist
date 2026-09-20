import type {
  EnvironmentalContext,
  EnvironmentalAssessmentItem,
  EnvironmentalInteraction,
  RetrievedEvidence,
} from '../src/types/environmental.js';

export class MultiMetricReasoningEngine {
  /**
   * Generates environmental assessments for each active metric against scientific thresholds.
   */
  public assessConditions(context: EnvironmentalContext): EnvironmentalAssessmentItem[] {
    const items: EnvironmentalAssessmentItem[] = [];

    // 1. Soil Organic Carbon
    if (context.soil.organic_carbon_percent !== null) {
      const soc = context.soil.organic_carbon_percent;
      let status: EnvironmentalAssessmentItem['status'] = 'optimal';
      let interpretation = '';

      if (soc < 0.5) {
        status = 'critical';
        interpretation = `Critically depleted (<0.5%). Below threshold for soil aggregate stability; high risk of surface crusting, impaired water infiltration, and suppressed soil microbial biomass (FAO 2020).`;
      } else if (soc < 1.0) {
        status = 'suboptimal';
        interpretation = `Suboptimal (<1.0%). Moderate water retention capacity; requires organic matter replenishment to support resilient microbial communities.`;
      } else if (soc < 2.0) {
        status = 'moderate';
        interpretation = `Moderate (1.0 - 2.0%). Adequate for baseline cereal production, but vulnerable to drought stress in dryland zones.`;
      } else {
        status = 'optimal';
        interpretation = `Optimal (>2.0%). High water holding capacity, robust glomalin production, and active soil rhizosphere biodiversity.`;
      }

      items.push({
        metric: 'Soil Organic Carbon (SOC)',
        value: `${soc}%`,
        status,
        interpretation,
      });
    }

    // 2. Soil pH
    if (context.soil.ph !== null) {
      const ph = context.soil.ph;
      let status: EnvironmentalAssessmentItem['status'] = 'optimal';
      let interpretation = '';

      if (ph < 5.5) {
        status = 'critical';
        interpretation = `Strongly acidic (pH < 5.5). Risk of aluminum toxicity and phosphorus fixation; suppresses rhizobial nitrogen fixation in legumes (FAO 2017).`;
      } else if (ph > 8.0) {
        status = 'suboptimal';
        interpretation = `Alkaline/calcareous (pH > 8.0). Micronutrient lock-up (Fe, Zn, Mn) and reduced phosphorus bioavailability.`;
      } else {
        status = 'optimal';
        interpretation = `Neutral to slightly acidic/alkaline (pH 6.0 - 7.5). Optimal nutrient bioavailability and microbial enzymatic activity.`;
      }

      items.push({
        metric: 'Soil pH',
        value: ph,
        status,
        interpretation,
      });
    }

    // 3. Soil Moisture
    if (context.soil.moisture_percent !== null) {
      const moisture = context.soil.moisture_percent;
      const status: EnvironmentalAssessmentItem['status'] = moisture < 10 ? 'critical' : moisture < 18 ? 'suboptimal' : 'moderate';
      items.push({
        metric: 'Soil Moisture',
        value: `${moisture}%`,
        status,
        interpretation: moisture < 10 
          ? 'Approaching permanent wilting point; insufficient capillary water for biological nutrient uptake.'
          : 'Suboptimal soil moisture; requires soil surface residue conservation to impede evaporation.',
      });
    }

    // 4. Land & Cropping System
    if (context.land.cropping_system || context.land.crop) {
      const system = context.land.cropping_system || 'unspecified';
      const crop = context.land.crop || 'annual crops';
      const isMonoculture = system.toLowerCase().includes('monoculture');

      items.push({
        metric: 'Cropping Architecture',
        value: `${system.toUpperCase()}: ${crop}`,
        status: isMonoculture ? 'critical' : 'moderate',
        interpretation: isMonoculture
          ? 'Monoculture creates uniform root exudate profiles, depleting soil biological functional diversity and offering zero non-crop floral resources for pollinators (IPBES 2016, FAO 2019).'
          : 'Diversified cropping system maintains multi-tier canopy and complementary root strata.',
      });
    }

    // 5. Climate & Precipitation
    if (context.climate.rainfall_pattern || context.location.region || context.climate.rainfall_mm !== null) {
      const pattern = context.climate.rainfall_pattern || 'unspecified';
      const region = context.location.region || 'unspecified';
      const mm = context.climate.rainfall_mm !== null ? ` (~${context.climate.rainfall_mm}mm)` : '';
      const isDry = pattern.toLowerCase().includes('low') || region.toLowerCase().includes('arid') || region.toLowerCase().includes('semi-arid');

      items.push({
        metric: 'Hydroclimatic Regime',
        value: `${region} region / ${pattern} precipitation${mm}`,
        status: isDry ? 'critical' : 'moderate',
        interpretation: isDry
          ? 'High atmospheric evaporative deficit with constrained water recharge, amplifying crop vulnerability during heat spells (IPCC AR6 WGII).'
          : 'Moisture regime supports standard vegetative growth.',
      });
    }

    // 6. Biodiversity Indicators
    if (context.biodiversity.species_richness || context.biodiversity.pollinator_diversity) {
      items.push({
        metric: 'Biodiversity Baseline',
        value: `Species richness: ${context.biodiversity.species_richness || 'unknown'} | Pollinators: ${context.biodiversity.pollinator_diversity || 'unknown'}`,
        status: 'critical',
        interpretation: 'Severe disruption of trophic web and decline in essential ecosystem service providers (biological pest control and pollination).',
      });
    }

    return items;
  }

  /**
   * Evaluates interactions across at least 3 environmental variables simultaneously.
   */
  public evaluateInteractions(
    context: EnvironmentalContext,
    evidenceList: RetrievedEvidence[]
  ): EnvironmentalInteraction[] {
    const interactions: EnvironmentalInteraction[] = [];

    const hasLowSoc = context.soil.organic_carbon_percent !== null && context.soil.organic_carbon_percent <= 0.8;
    const hasDryClimate = (context.climate.rainfall_pattern && context.climate.rainfall_pattern.toLowerCase().includes('low')) ||
                          (context.location.region && (context.location.region.toLowerCase().includes('semi-arid') || context.location.region.toLowerCase().includes('arid'))) ||
                          (context.climate.rainfall_mm !== null && context.climate.rainfall_mm < 400);
    const hasMonoculture = context.land.cropping_system && context.land.cropping_system.toLowerCase().includes('monoculture');
    const isCereal = context.land.crop && ['wheat', 'barley', 'cereal', 'maize', 'corn'].includes(context.land.crop.toLowerCase());

    // --- CORE INTERACTION 1: SOC ↔ Rainfall ↔ Monoculture Cereal in Semi-Arid Zone (4 variables) ---
    if (hasLowSoc && hasDryClimate && (hasMonoculture || isCereal)) {
      interactions.push({
        variables: ['Soil Organic Carbon', 'Rainfall / Water Availability', 'Monoculture Cereal System', 'Semi-Arid Bioclimate'],
        interaction_type: 'Compounding Hydrological & Soil Degradation Feedback',
        description: `Under semi-arid low rainfall conditions, soil organic carbon of ${context.soil.organic_carbon_percent ?? '<0.5'}% deprives the topsoil of organic sponges. Monoculture ${context.land.crop || 'cereal'} cultivation leaves soil bare post-harvest, exposing depleted humus to high solar radiation and wind erosion. The absence of diverse root channels impedes episodic rainwater infiltration, causing water to evaporate or run off rather than recharging deep root profiles.`,
        scientific_basis: 'FAO Recarbonizing Soils (2020) & IPCC SRCCL (2019): SOC < 0.5% reduces available water retention by up to 30%, multiplying agricultural drought frequency under semi-arid conditions.',
        severity_or_importance: 'critical',
      });
    }

    // --- INTERACTION 2: Monoculture ↔ Pollinator Collapse ↔ Habitat Diversity (3 variables) ---
    if (hasMonoculture && (isCereal || context.biodiversity.pollinator_diversity !== null || context.biodiversity.species_richness !== null)) {
      interactions.push({
        variables: ['Monoculture Crop', 'Pollinator Foraging Habitat', 'Aboveground Species Richness'],
        interaction_type: 'Trophic Desertification & Floral Resource Discontinuity',
        description: `Continuous ${context.land.crop || 'cereal'} monocultures do not produce nectar or insect-palatable pollen, creating a biological desert for wild pollinators and predatory beneficial insects. When fields lack flowering margins or companion species, wild bee and hoverfly populations collapse due to seasonal starvation gaps.`,
        scientific_basis: 'IPBES Assessment on Pollinators (2016): Monocultural cereals across large parcels reduce pollinator species richness by over 50% compared to diverse agroecosystems.',
        severity_or_importance: 'high',
      });
    }

    // --- INTERACTION 3: Soil Organic Carbon ↔ Microbial Biodiversity ↔ Nutrient Cycling (3 variables) ---
    if (hasLowSoc || (context.soil.ph !== null && context.soil.ph < 6.0)) {
      interactions.push({
        variables: ['Soil Organic Carbon', 'Rhizosphere Microbial Biodiversity', 'Nutrient Bioavailability'],
        interaction_type: 'Microbial Depletion & Reduced Nutrient Use Efficiency',
        description: `Depleted soil organic carbon restricts the primary energy substrate for heterotrophic soil bacteria and mycorrhizal fungi. Without robust mycorrhizal networks (glomalin producers), phosphorus and micronutrient uptake is constrained, forcing higher reliance on synthetic fertilizers that further acidify or degrade the biological rhizosphere.`,
        scientific_basis: 'FAO State of the World Biodiversity for Food and Agriculture (2019): Microbial diversity directly governs soil structural stability and nitrogen/phosphorus cycling.',
        severity_or_importance: 'high',
      });
    }

    // --- INTERACTION 4: Climate Drought ↔ Soil Moisture ↔ Crop Vulnerability (3 variables) ---
    if (hasDryClimate) {
      interactions.push({
        variables: ['Rainfall Pattern', 'Soil Moisture Retention', 'Thermal Evaporative Stress'],
        interaction_type: 'Microclimatic Thermal & Evapotranspirative Deficit',
        description: `In semi-arid zones with erratic or low rainfall, unshaded soil reaches extreme midday surface temperatures (up to 45-50°C), drastically accelerating direct surface evaporation and sterilizing topsoil microbiota.`,
        scientific_basis: 'UNEP Dryland Restoration Guidelines (2021) & IPCC WGII (2022): Canopy diversification and residue retention reduce soil surface temperature by 3-6°C and lower evaporative losses.',
        severity_or_importance: 'high',
      });
    }

    // Fallback if sparse variables are supplied
    if (interactions.length === 0) {
      interactions.push({
        variables: ['Observed Ecosystem Attributes', 'Ecosystem Disturbance Baseline', 'Landscape Matrix'],
        interaction_type: 'Ecosystem Balance and Structural Connectivity',
        description: 'Interactions between soil structure, vegetative cover, and climatic moisture dictate overall ecological resilience.',
        scientific_basis: 'IPBES Global Assessment (2019): Multi-metric ecological dynamics govern ecosystem degradation and restoration trajectories.',
        severity_or_importance: 'moderate',
      });
    }

    return interactions;
  }
}

export const multiMetricReasoningEngine = new MultiMetricReasoningEngine();
