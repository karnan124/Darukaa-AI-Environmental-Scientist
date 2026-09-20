import json
import math
import os
import re
from typing import List, Dict, Any, Set

class ScientificRetriever:
    def __init__(self, seed_path: str = None):
        if not seed_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            seed_path = os.path.join(base_dir, "data", "seed", "environmental_knowledge.json")
        self.seed_path = seed_path
        self.documents: List[Dict[str, Any]] = []
        self.chunks: List[Dict[str, Any]] = []
        self.idf_map: Dict[str, float] = {}
        self.load_and_index()

    def tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s\d.-]", " ", text.lower())
        return [t for t in cleaned.split() if len(t) > 2]

    def load_and_index(self):
        if not os.path.exists(self.seed_path):
            return

        with open(self.seed_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        self.chunks = []
        doc_frequencies: Dict[str, int] = {}

        for doc in self.documents:
            content = doc.get("content", "")
            tokens = self.tokenize(f"{doc.get('title', '')} {doc.get('topic', '')} {' '.join(doc.get('variables', []))} {content}")
            token_set = set(tokens)
            
            tf_map: Dict[str, int] = {}
            for t in tokens:
                tf_map[t] = tf_map.get(t, 0) + 1

            for t in token_set:
                doc_frequencies[t] = doc_frequencies.get(t, 0) + 1

            self.chunks.append({
                "doc_id": doc.get("id"),
                "title": doc.get("title"),
                "source": doc.get("source"),
                "organization": doc.get("organization"),
                "year": doc.get("year"),
                "url": doc.get("url"),
                "topic": doc.get("topic"),
                "variables": doc.get("variables", []),
                "content": content,
                "tokens": token_set,
                "tf_map": tf_map
            })

        total = max(1, len(self.chunks))
        for term, df in doc_frequencies.items():
            self.idf_map[term] = math.log((total + 1) / (df + 1)) + 1.0

    def search(self, query: str, variables: List[str] = None, limit: int = 4) -> List[Dict[str, Any]]:
        if not variables:
            variables = []
        q_tokens = self.tokenize(query)
        var_set = {v.lower().replace(" ", "_") for v in variables}

        scored = []
        for chunk in self.chunks:
            score = 0.0
            for t in q_tokens:
                if t in chunk["tokens"]:
                    tf = chunk["tf_map"].get(t, 1)
                    idf = self.idf_map.get(t, 1.0)
                    score += (1 + math.log(tf)) * idf

            for v in chunk["variables"]:
                if v.lower().replace(" ", "_") in var_set or v.lower() in query.lower():
                    score += 4.5

            norm_score = min(0.99, round(score / (score + 10.0), 3))
            scored.append((norm_score, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)

        results = []
        seen = set()
        for s, chunk in scored:
            if chunk["doc_id"] not in seen:
                seen.add(chunk["doc_id"])
                results.append({
                    "id": chunk["doc_id"],
                    "title": chunk["title"],
                    "source": chunk["source"],
                    "organization": chunk["organization"],
                    "year": chunk["year"],
                    "url": chunk["url"],
                    "topic": chunk["topic"],
                    "variables": chunk["variables"],
                    "content": chunk["content"],
                    "relevance_score": s,
                    "why_relevant": f"Direct peer-reviewed evidence matching {', '.join(chunk['variables'])} from {chunk['organization']}."
                })
            if len(results) >= limit:
                break

        return results
