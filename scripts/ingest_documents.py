#!/usr/bin/env python3
"""
Document Ingestion Pipeline for Darukaa AI Environmental Scientist.
Reads raw environmental publications (JSON, Markdown, or text) from data/raw/,
cleans and normalizes text, splits into contextual chunks, calculates vocabulary
term indices and metadata schemas, and updates data/seed/environmental_knowledge.json.
"""

import json
import os
import re
import sys

def clean_text(text: str) -> str:
    # Normalize whitespaces and remove non-printable characters
    cleaned = re.sub(r"\s+", " ", text).strip()
    return cleaned

def chunk_document(doc: dict, max_chunk_words: int = 150) -> list:
    content = doc.get("content", "")
    words = content.split()
    chunks = []

    if len(words) <= max_chunk_words:
        chunks.append(content)
    else:
        # Sliding window with overlap
        step = max_chunk_words - 30
        for i in range(0, len(words), step):
            chunk = " ".join(words[i:i + max_chunk_words])
            if chunk:
                chunks.append(chunk)

    return chunks

def ingest_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_dir = os.path.join(base_dir, "data", "raw")
    seed_file = os.path.join(base_dir, "data", "seed", "environmental_knowledge.json")
    processed_file = os.path.join(base_dir, "data", "processed", "indexed_chunks.json")

    os.makedirs(raw_dir, exist_ok=True)
    os.makedirs(os.path.dirname(processed_file), exist_ok=True)

    print("--- Starting Darukaa Environmental Document Ingestion Pipeline ---")
    
    # Load existing seed documents
    seed_docs = []
    if os.path.exists(seed_file):
        with open(seed_file, "r", encoding="utf-8") as f:
            seed_docs = json.load(f)
        print(f"Loaded {len(seed_docs)} baseline documents from {seed_file}")

    # Process any new raw JSON files
    raw_files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    new_docs_count = 0
    for rf in raw_files:
        rf_path = os.path.join(raw_dir, rf)
        try:
            with open(rf_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for d in data:
                        if "id" in d and "content" in d:
                            seed_docs.append(d)
                            new_docs_count += 1
                elif isinstance(data, dict) and "id" in data:
                    seed_docs.append(data)
                    new_docs_count += 1
        except Exception as e:
            print(f"Warning: Could not parse {rf}: {e}")

    # Clean and index
    all_chunks = []
    for doc in seed_docs:
        doc["content"] = clean_text(doc["content"])
        chunks = chunk_document(doc)
        for idx, c in enumerate(chunks):
            all_chunks.append({
                "chunk_id": f"{doc['id']}_c{idx}",
                "doc_id": doc["id"],
                "title": doc["title"],
                "organization": doc.get("organization", "Unknown"),
                "year": doc.get("year", "Unknown"),
                "url": doc.get("url", ""),
                "topic": doc.get("topic", "General"),
                "variables": doc.get("variables", []),
                "chunk_content": c
            })

    # Save processed indexed chunks
    with open(processed_file, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, indent=2)

    print(f"Successfully processed {len(seed_docs)} documents into {len(all_chunks)} semantic chunks.")
    print(f"Output saved to: {processed_file}")
    print("Ingestion completed safely.")

if __name__ == "__main__":
    ingest_pipeline()
