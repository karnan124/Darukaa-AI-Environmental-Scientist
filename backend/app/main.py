from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from backend.app.services.scientist import EnvironmentalScientist

app = FastAPI(
    title="Darukaa AI Environmental Scientist API",
    description="Conversational Environmental Intelligence System with Scientific Knowledge Retrieval, Multi-Metric Reasoning, and Evidence-Backed Recommendations.",
    version="1.0.0"
)

scientist = EnvironmentalScientist()

class ChatRequest(BaseModel):
    sessionId: Optional[str] = "default"
    text: Optional[str] = None
    structuredContext: Optional[Dict[str, Any]] = None
    forceAnalyze: Optional[bool] = False

class AnalyzeRequest(BaseModel):
    environment: Optional[Dict[str, Any]] = None
    question: Optional[str] = "How can I improve biodiversity?"
    sessionId: Optional[str] = "default"

class KnowledgeSearchRequest(BaseModel):
    query: str
    variables: Optional[List[str]] = []
    limit: Optional[int] = 4

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Darukaa AI Environmental Scientist"}

@app.post("/api/chat")
def chat(req: ChatRequest):
    try:
        res = scientist.process(
            session_id=req.sessionId or "default",
            text=req.text,
            structured=req.structuredContext,
            force_analyze=req.forceAnalyze or False
        )
        return {
            "success": True,
            "message": {"text": res["message"], "is_clarification": res["is_clarification"]},
            "context": res["context"],
            "analysis": res["analysis"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
def analyze(req: AnalyzeRequest):
    try:
        res = scientist.process(
            session_id=req.sessionId or "default",
            text=req.question,
            structured=req.environment,
            force_analyze=True
        )
        analysis = res.get("analysis", {})
        return {
            "success": True,
            "summary": analysis.get("summary", ""),
            "missing_information": analysis.get("missing_information", []),
            "environmental_assessment": analysis.get("environmental_assessment", []),
            "interactions": analysis.get("interactions", []),
            "recommendations": analysis.get("recommendations", []),
            "sources": analysis.get("sources", []),
            "context_snapshot": res.get("context", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/knowledge/search")
def search_knowledge(req: KnowledgeSearchRequest):
    results = scientist.retriever.search(req.query, req.variables, req.limit or 4)
    return {
        "success": True,
        "query": req.query,
        "results": results,
        "count": len(results)
    }

@app.get("/api/knowledge/stats")
def knowledge_stats():
    return {
        "success": True,
        "totalDocuments": len(scientist.retriever.documents),
        "totalChunks": len(scientist.retriever.chunks)
    }
