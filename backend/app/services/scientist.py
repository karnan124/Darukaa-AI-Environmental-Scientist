from typing import Dict, Any, Optional
from backend.app.models.environmental import EnvironmentalContext, AnalysisOutput
from backend.app.rag.retriever import ScientificRetriever
from backend.app.reasoning.engine import EnvironmentalReasoningEngine
from backend.app.memory.manager import ConversationMemory

class EnvironmentalScientist:
    def __init__(self):
        self.retriever = ScientificRetriever()
        self.reasoning = EnvironmentalReasoningEngine()
        self.memory = ConversationMemory()

    def process(self, session_id: str, text: Optional[str], structured: Optional[Dict[str, Any]] = None, force_analyze: bool = False) -> Dict[str, Any]:
        context = self.memory.get_or_create(session_id)

        # Merge structured input if provided
        if structured:
            context = self.memory.update_context(session_id, structured)

        # Simple text extraction for basic variables
        if text:
            extracted = self._extract_from_text(text)
            if extracted:
                context = self.memory.update_context(session_id, extracted)

        # Clarification check
        has_soil = context.soil.organic_carbon_percent is not None or context.soil.ph is not None
        has_land = context.land.crop is not None or context.land.cropping_system is not None
        has_climate = context.climate.rainfall_pattern is not None or context.location.region is not None

        is_vague = text and ("biodiversity is declining" in text.lower() or "help my farm" in text.lower()) and not has_soil and not has_climate

        if not force_analyze and (not (has_soil or has_land) or is_vague):
            questions = [
                "What crop or vegetation is present, and is it managed as a monoculture or polyculture?",
                "What is the approximate soil organic carbon (SOC) level or soil moisture condition?",
                "What is the typical rainfall pattern or climatic zone (e.g., semi-arid, temperate)?"
            ]
            clarify_msg = "To provide an evidence-grounded scientific assessment, please clarify:\n\n" + "\n".join(f"- {q}" for q in questions)
            self.memory.add_message(session_id, "assistant", clarify_msg, {"is_clarification": True})
            return {
                "message": clarify_msg,
                "is_clarification": True,
                "context": context.dict(),
                "analysis": None
            }

        # Retrieval
        search_q = f"{text or ''} {context.location.region or ''} {context.land.crop or ''} {context.land.cropping_system or ''}"
        sources = self.retriever.search(search_q, ["soil_organic_carbon", "rainfall", "monoculture", "biodiversity"], limit=4)

        # Reasoning
        assessment = self.reasoning.assess_conditions(context)
        interactions = self.reasoning.derive_interactions(context, sources)
        recommendations = self.reasoning.build_recommendations(context, interactions, sources)

        summary = (
            f"Observed Conditions: Region={context.location.region or 'N/A'}, "
            f"SOC={context.soil.organic_carbon_percent or 'N/A'}%, "
            f"Crop={context.land.crop or 'N/A'} ({context.land.cropping_system or 'N/A'}). "
            f"Identified {len(interactions)} multi-metric interactions and {len(recommendations)} evidence-backed recommendations."
        )

        analysis = AnalysisOutput(
            summary=summary,
            missing_information=[],
            clarification_needed=False,
            environmental_assessment=assessment,
            interactions=interactions,
            recommendations=recommendations,
            sources=sources,
            context_snapshot=context,
            active_variables_count=sum(1 for s in [has_soil, has_land, has_climate] if s)
        )

        self.memory.add_message(session_id, "assistant", summary, {"analysis": analysis.dict()})

        return {
            "message": summary,
            "is_clarification": False,
            "context": context.dict(),
            "analysis": analysis.dict()
        }

    def _extract_from_text(self, text: str) -> Dict[str, Any]:
        lower = text.lower()
        res = {"soil": {}, "land": {}, "climate": {}, "location": {}, "biodiversity": {}}
        import re
        soc = re.search(r"(\d+(?:\.\d+)?)\s*%\s*(?:soil\s+organic\s+carbon|soc|organic\s+carbon)", lower) or \
              re.search(r"(?:soil\s+organic\s+carbon|soc)\s*(?:is|of|level)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%", lower)
        if soc:
            res["soil"]["organic_carbon_percent"] = float(soc.group(1))

        if "monoculture" in lower:
            res["land"]["cropping_system"] = "monoculture"
        if "wheat" in lower:
            res["land"]["crop"] = "wheat"
        if "semi-arid" in lower or "semi arid" in lower:
            res["location"]["region"] = "semi-arid"
        if "low rainfall" in lower or "rainfall is low" in lower:
            res["climate"]["rainfall_pattern"] = "low"
        if "declining" in lower and "biodiversity" in lower:
            res["biodiversity"]["species_richness"] = "declining"

        return {k: v for k, v in res.items() if v}
