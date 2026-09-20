import pytest
from backend.app.services.scientist import EnvironmentalScientist
from backend.app.rag.retriever import ScientificRetriever
from backend.app.models.environmental import EnvironmentalContext

def test_environmental_context_initialization():
    ctx = EnvironmentalContext()
    assert ctx.soil.organic_carbon_percent is None
    assert ctx.land.crop is None
    assert ctx.climate.rainfall_pattern is None

def test_rag_retrieval():
    retriever = ScientificRetriever()
    results = retriever.search("wheat monoculture low rainfall soil carbon", ["soil_organic_carbon", "monoculture"], limit=3)
    assert len(results) >= 2
    assert results[0]["title"] is not None
    assert results[0]["organization"] is not None
    assert "relevance_score" in results[0]

def test_clarification_on_vague_inquiry():
    scientist = EnvironmentalScientist()
    res = scientist.process("session_vague", "My biodiversity is declining.", force_analyze=False)
    assert res["is_clarification"] is True
    assert "clarify" in res["message"].lower()

def test_benchmark_scenario_multi_metric_reasoning():
    scientist = EnvironmentalScientist()
    benchmark_text = "My biodiversity is declining on my wheat farm. The soil organic carbon is 0.3%, rainfall is low and the region is semi-arid."
    res = scientist.process("session_benchmark", benchmark_text, force_analyze=True)
    assert res["is_clarification"] is False
    assert res["analysis"] is not None
    analysis = res["analysis"]
    assert len(analysis["recommendations"]) >= 2
    assert len(analysis["interactions"]) >= 1
    assert len(analysis["sources"]) >= 2
    
    # Check recommendation properties
    rec = analysis["recommendations"][0]
    assert rec["action"] is not None
    assert rec["why_it_works"] is not None
    assert rec["time_horizon"] in ["Short term", "Medium term", "Long term"]
    assert rec["confidence"] in ["High", "Medium", "Low"]
    assert rec["evidence"]["source_title"] is not None

def test_conversation_memory_accumulation():
    scientist = EnvironmentalScientist()
    sid = "session_acc"
    scientist.process(sid, "The soil organic carbon is 0.3%.", force_analyze=False)
    scientist.process(sid, "Rainfall is low.", force_analyze=False)
    final_res = scientist.process(sid, "Crop is monoculture wheat in a semi-arid zone.", force_analyze=True)
    ctx = final_res["context"]
    assert ctx["soil"]["organic_carbon_percent"] == 0.3
    assert ctx["climate"]["rainfall_pattern"] == "low"
    assert ctx["land"]["crop"] == "wheat"
    assert ctx["land"]["cropping_system"] == "monoculture"
