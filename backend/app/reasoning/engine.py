from typing import List, Dict, Any
from backend.app.models.environmental import (
    EnvironmentalContext,
    EnvironmentalAssessmentItem,
    EnvironmentalInteraction,
    Recommendation,
    EvidenceSource
)

class EnvironmentalReasoningEngine:
    def assess_conditions(self, context: EnvironmentalContext) -> List[EnvironmentalAssessmentItem]:
        items = []
        if context.soil.organic_carbon_percent is not None:
            soc = context.soil.organic_carbon_percent
            if soc < 0.5:
                status = "critical"
                interp = "Critically depleted (<0.5%). High risk of surface crusting, impaired water infiltration (FAO 2020)."
            elif soc < 1.0:
                status = "suboptimal"
                interp = "Suboptimal (<1.0%). Moderate water retention; requires organic matter replenishment."
            else:
                status = "optimal"
                interp = "Adequate organic carbon reserves."
            items.append(EnvironmentalAssessmentItem(metric="Soil Organic Carbon (SOC)", value=f"{soc}%", status=status, interpretation=interp))

        if context.soil.ph is not None:
            ph = context.soil.ph
            status = "critical" if ph < 5.5 else "suboptimal" if ph > 8.0 else "optimal"
            interp = "Strongly acidic; aluminum toxicity risk" if ph < 5.5 else "Calcareous/alkaline" if ph > 8.0 else "Optimal pH range"
            items.append(EnvironmentalAssessmentItem(metric="Soil pH", value=ph, status=status, interpretation=interp))

        if context.land.cropping_system or context.land.crop:
            system = context.land.cropping_system or "unspecified"
            crop = context.land.crop or "cereal"
            is_mono = "monoculture" in system.lower()
            items.append(EnvironmentalAssessmentItem(
                metric="Cropping System",
                value=f"{system}: {crop}",
                status="critical" if is_mono else "moderate",
                interpretation="Monoculture depletes biological functional diversity (IPBES 2016, FAO 2019)." if is_mono else "Diverse system."
            ))

        if context.climate.rainfall_pattern or context.location.region:
            reg = context.location.region or "unspecified"
            rain = context.climate.rainfall_pattern or "unspecified"
            is_dry = "low" in rain.lower() or "semi-arid" in reg.lower() or "arid" in reg.lower()
            items.append(EnvironmentalAssessmentItem(
                metric="Hydroclimate",
                value=f"{reg} / {rain} rain",
                status="critical" if is_dry else "moderate",
                interpretation="High evaporative deficit; amplified drought vulnerability (IPCC WGII 2022)." if is_dry else "Favorable moisture."
            ))

        return items

    def derive_interactions(self, context: EnvironmentalContext, evidence: List[Dict[str, Any]]) -> List[EnvironmentalInteraction]:
        interactions = []
        has_low_soc = context.soil.organic_carbon_percent is not None and context.soil.organic_carbon_percent <= 0.8
        has_dry = (context.climate.rainfall_pattern and "low" in context.climate.rainfall_pattern.lower()) or \
                  (context.location.region and ("semi-arid" in context.location.region.lower() or "arid" in context.location.region.lower()))
        has_mono = context.land.cropping_system and "monoculture" in context.land.cropping_system.lower()

        if has_low_soc and has_dry and has_mono:
            interactions.append(EnvironmentalInteraction(
                variables=["Soil Organic Carbon", "Rainfall / Water Availability", "Monoculture Cropping", "Semi-Arid Bioclimate"],
                interaction_type="Compounding Hydrological & Soil Degradation Feedback",
                description=f"Under semi-arid low rainfall conditions, soil organic carbon of {context.soil.organic_carbon_percent}% deprives topsoil of water-holding capacity. Monoculture {context.land.crop or 'wheat'} leaves soil vulnerable to intense evaporation and erosion.",
                scientific_basis="FAO Recarbonizing Soils (2020) & IPCC SRCCL (2019): SOC < 0.5% reduces water retention by up to 30%, multiplying drought vulnerability.",
                severity_or_importance="critical"
            ))

        if has_mono:
            interactions.append(EnvironmentalInteraction(
                variables=["Monoculture Crop", "Pollinator Diversity", "Habitat Structure"],
                interaction_type="Trophic Desertification & Floral Resource Discontinuity",
                description=f"Continuous {context.land.crop or 'cereal'} monocultures provide neither nectar nor forage, resulting in wild pollinator population collapse.",
                scientific_basis="IPBES Assessment on Pollinators (2016): Monoculture parcels reduce pollinator species richness by over 50%.",
                severity_or_importance="high"
            ))

        return interactions

    def build_recommendations(self, context: EnvironmentalContext, interactions: List[EnvironmentalInteraction], evidence: List[Dict[str, Any]]) -> List[Recommendation]:
        recs = []
        is_mono = context.land.cropping_system and "monoculture" in context.land.cropping_system.lower()
        is_dry = (context.climate.rainfall_pattern and "low" in context.climate.rainfall_pattern.lower()) or \
                 (context.location.region and "semi-arid" in context.location.region.lower())

        if is_mono or (context.land.crop and "wheat" in context.land.crop.lower()):
            recs.append(Recommendation(
                id="rec_pulse_intercrop",
                action=f"Transition from monoculture {context.land.crop or 'wheat'} to strip intercropping with drought-resilient legumes (e.g. chickpea or lentil) and reduced tillage.",
                why_it_works="Complementary root depths explore distinct soil strata while rhizobial nodulation fixes biological nitrogen, boosting microbial biomass.",
                impacted_metrics=["Soil Organic Carbon", "Microbial Biodiversity", "Species Richness", "Soil Moisture Retention"],
                time_horizon="Medium term",
                expected_impact="Measurable microbial biodiversity increase in 1-2 seasons; SOC accumulation requires 3-7 years in drylands (FAO 2020). Insufficient evidence to provide a universal yield percentage.",
                evidence=EvidenceSource(
                    source_title="Cereal-Legume Intercropping Improves Grain Yield and Soil Biodiversity in Low-Input Systems",
                    organization="Nature Plants / Research Consortium",
                    year=2020,
                    url="https://doi.org/10.1038/s41477-020-0680-9"
                ),
                confidence="High",
                limitations="Requires calibration of seeding density in semi-arid conditions (<350mm rain) to prevent crop-water competition."
            ))

        if is_mono or context.biodiversity.pollinator_diversity is not None:
            recs.append(Recommendation(
                id="rec_pollinator_margins",
                action="Establish perennial native flowering hedgerows and field margins (3-6m wide) along arable field boundaries.",
                why_it_works="Supplies continuous floral nectar and pollen resources, bridging forage starvation gaps and establishing windbreaks.",
                impacted_metrics=["Pollinator Diversity", "Habitat Diversity", "Wind Erosion Resistance"],
                time_horizon="Short term",
                expected_impact="IPBES (2016) reports that dedicating 15-20% field margins to semi-natural flowering habitat supports up to doubling of wild pollinator richness.",
                evidence=EvidenceSource(
                    source_title="Assessment Report on Pollinators, Pollination and Food Production",
                    organization="IPBES",
                    year=2016,
                    url="https://www.ipbes.net/assessment-reports/pollinators"
                ),
                confidence="High",
                limitations="Must be shielded from agrochemical spray drift."
            ))

        if is_dry:
            recs.append(Recommendation(
                id="rec_stubble_mulch",
                action="Maintain 100% crop residue stubble retention post-harvest to preserve a soil moisture armor blanket.",
                why_it_works="Suppresses soil surface temperature by 3-6°C, mitigating evaporation and buffering microbial habitats against solar desiccation.",
                impacted_metrics=["Soil Moisture", "Soil Organic Carbon", "Soil Surface Temperature"],
                time_horizon="Short term",
                expected_impact="USGS reports 20-35% reduction in evaporation; long-term SOC gain of 0.1-0.2% over 3-5 years (FAO 2020).",
                evidence=EvidenceSource(
                    source_title="Soil Moisture Dynamics and Groundwater Recharge Under Conservation Agriculture",
                    organization="USGS",
                    year=2021,
                    url="https://pubs.usgs.gov/wri/wri024045/"
                ),
                confidence="High",
                limitations="Requires no-till seeding disc openers capable of penetrating heavy residue."
            ))

        return recs
