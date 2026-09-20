# AI Environmental Scientist

> **Evidence-Grounded Conversational Environmental Intelligence & Multi-Metric Ecosystem Reasoning**

[![CI/CD Pipeline](https://github.com/karnan124/Darukaa.Earth-AI-Biodiversity-Intelligence-Chatbot-Challenge/actions/workflows/ci.yml/badge.svg)](https://github.com/karnan124/Darukaa.Earth-AI-Biodiversity-Intelligence-Chatbot-Challenge/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.x-38bdf8.svg)](https://tailwindcss.com/)

---

## 1. Executive Summary & Architecture

The **AI Environmental Scientist** is a full-stack, evidence-grounded intelligence platform designed for agroecological diagnostics and land management decision support. Unlike generic chatbots that hallucinate unsupported statistics, this system operates under strict scientific constraints:
- **Zero Hallucination Tolerance**: Recommendations cite peer-reviewed institutional literature (FAO, IPCC, IPBES, UNEP, USGS).
- **Multi-Metric Environmental Reasoning**: Compounding analyses connect at least 3 environmental variables simultaneously (e.g., Soil Organic Carbon $\leftrightarrow$ Rainfall Regime $\leftrightarrow$ Monoculture Cropping $\leftrightarrow$ Bioclimate).
- **Proactive Clarification**: Prevents generic advice by detecting missing biophysical boundaries across the 5 pillars.
- **Conversational Memory**: Accumulates field state across multiple interactive turns.

### High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Interactive Scientist UI                        │
│   • 5-Pillar Context Model Bar   • Natural Language Input & Suggested  │
│   • Real-Time Diagnostics Matrix • Interactive Knowledge Base Drawer   │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  HTTP /api/chat, /api/analyze
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Server & Session Router                         │
│                  (Express TypeScript + Vite SPA Engine)                │
└──────────┬───────────────────────┬──────────────────────┬──────────────┘
           │                       │                      │
           ▼                       ▼                      ▼
┌──────────────────────┐ ┌────────────────────┐ ┌─────────────────────────┐
│ Natural Language     │ │ Multi-Turn Memory  │ │ Missing-Information     │
│ Extractor            │ │ Manager            │ │ & Clarification Engine  │
│ (Dual Hybrid Parsing)│ │ (State Aggregator) │ │ (5-Pillar Completeness) │
└──────────┬───────────┘ └─────────┬──────────┘ └─────────┬───────────────┘
           │                       │                      │
           └───────────────────────┼──────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                Authoritative Institutional RAG Engine                  │
│       (TF-IDF / Vector Retrieval Across Indexed Scientific Chunks)     │
│        • FAO (2020) Recarbonizing Global Soils                         │
│        • IPBES (2016) Pollinator Assessment                            │
│        • IPCC (2019/2022) Land Degradation & Climate Adaptation        │
│        • UNEP (2021) Dryland Restoration Guidelines                    │
│        • USGS (2021) Soil Hydrology & Infiltration Studies             │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Multi-Metric Ecosystem Reasoning Engine                  │
│   • Biophysical Diagnostic Thresholds (Critical, Suboptimal, Optimal)  │
│   • Compounding Interaction Derivations (≥3 Interconnected Variables) │
│   • Structured Actionable Recommendations (Action, Why, Limitations)   │
│   • Scientific Attribution & Institutional Citations                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Database & Data Schema

The platform utilizes a structured, reproducible scientific database with zero opaque binary dependencies:

### Location of Indexed Knowledge
- `data/seed/environmental_knowledge.json`: Canonical institutional literature repository.
- `data/processed/indexed_chunks.json`: Normalized, tokenized, and tagged scientific chunks.

### Core Data Schemas (`src/types/environmental.ts`)

#### 1. The Five Environmental Pillars (`EnvironmentalContext`)
```typescript
export interface EnvironmentalContext {
  location: {
    region: string | null;           // e.g., "semi-arid", "temperate"
    latitude: number | null;
    longitude: number | null;
  };
  soil: {
    ph: number | null;               // e.g., 6.5
    organic_carbon_percent: number | null; // e.g., 0.3%
    moisture_percent: number | null; // e.g., 14%
  };
  land: {
    land_use: string | null;         // e.g., "cropland", "pasture"
    crop: string | null;             // e.g., "wheat", "maize"
    cropping_system: string | null;  // e.g., "monoculture", "intercropped"
    habitat_fragmentation: string | null; // "high", "moderate", "low"
  };
  biodiversity: {
    species_richness: string | null; // "high", "medium", "low"
    habitat_diversity: string | null;
    pollinator_diversity: string | null;
  };
  climate: {
    temperature_c: number | null;
    rainfall_mm: number | null;      // e.g., 320 mm
    rainfall_pattern: string | null; // "erratic", "low", "seasonal"
    water_availability: string | null;
  };
  human_impact: {
    pollution_level: string | null;  // "high", "moderate", "low"
    deforestation_pressure: string | null;
  };
}
```

#### 2. Recommendation Schema (`Recommendation`)
```typescript
export interface Recommendation {
  id: string;
  action: string;                    // Concrete intervention
  why_it_works: string;              // Biophysical rationale
  impacted_metrics: string[];        // Variables affected across pillars
  time_horizon: 'Short term' | 'Medium term' | 'Long term';
  expected_impact: string;           // Direction of change
  evidence: {
    source_title: string;
    organization: string;            // FAO, IPCC, IPBES, etc.
    year: number | string;
    url: string;                     // Verifiable reference URL
  };
  confidence: 'High' | 'Medium' | 'Low';
  limitations: string;               // Ecological trade-offs & constraints
}
```

---

## 3. Local Setup & Quickstart

### System Requirements
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Python**: `3.10+` (optional, for standalone document ingestion)

### 1. Clone & Install
```bash
git clone https://github.com/karnan124/Darukaa.Earth-AI-Biodiversity-Intelligence-Chatbot-Challenge.git
cd Darukaa.Earth-AI-Biodiversity-Intelligence-Chatbot-Challenge
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
*(Optional: Provide `GEMINI_API_KEY` for live generative augmentation; the system operates fully and deterministically even without an API key using the integrated scientific reasoning engine).*

### 3. Run Automated Verification Test Suite
Run the 9-part end-to-end verification suite:
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 5. Production Build & Execution
```bash
npm run build
npm start
```

---

## 4. CI/CD Details

A complete GitHub Actions workflow is preconfigured at `.github/workflows/ci.yml`.

### Pipeline Stages
1. **Lint & Typecheck**: Enforces strict TypeScript verification via `npm run lint` (`tsc --noEmit`).
2. **System Verification Test Suite**: Executes `npm test` (`backend/tests/test_environmental_system.ts`), validating:
   - 5-Pillar Environmental Context Model integrity
   - Natural language variable extraction (SOC, rainfall, crop, region)
   - Missing-information detection & proactive clarification triggers
   - RAG semantic retrieval relevance & metadata preservation
   - Multi-metric reasoning linking $\ge 3$ compounding variables
   - Recommendation schema completeness with limitation attribution
   - Multi-turn conversational state accumulation
   - Benchmark Scenario (`SOC 0.3% + low rainfall + wheat monoculture + semi-arid`)
3. **Production Compilation**: Bundles the application using Vite and esbuild.
4. **Python Document Ingestion Check**: Verifies the document chunking and indexing script (`scripts/ingest_documents.py`).

---

## 5. Submission Review Notes & Benchmark Walkthrough

### Official Challenge Benchmark Scenario
Enter the following statement in the Chat Panel (or click **"Suggested Inputs"** $\rightarrow$ **"Official Benchmark"**):
> *"Soil organic carbon is 0.3%, rainfall is low, crop is monoculture wheat in a semi-arid zone."*

#### Verified System Output:
1. **Context Extraction**: Accurately maps `soil.organic_carbon_percent: 0.3`, `climate.rainfall_pattern: "low"`, `land.crop: "wheat"`, `land.cropping_system: "monoculture"`, `location.region: "semi-arid"`.
2. **Multi-Metric Interaction Recognized**: Identifies the severe non-linear feedback loop between low SOC, degraded infiltration, high surface evaporation, and drought vulnerability.
3. **Grounded Interventions**:
   - *Cereal-Legume Strip Intercropping* (FAO Recarbonizing Soils, 2020)
   - *Native Flowering Buffer Strips & Windbreaks* (IPBES Pollinators Assessment, 2016)
   - *100% Residue Retention Stubble Mulch* (USGS Infiltration Studies, 2021)
4. **Attribution**: Full citation with institutional publisher, year, URL, and explicit ecological limitations.

### Live URLs & Repository
- **GitHub Repository**: [https://github.com/karnan124/Darukaa-AI-Environmental-Scientist](https://github.com/karnan124/Darukaa-AI-Environmental-Scientist)
- **Live Preview URL**: [https://ais-pre-2tsfufartps5kblt352i3o-26813527569.asia-east1.run.app](https://ais-pre-2tsfufartps5kblt352i3o-26813527569.asia-east1.run.app)
- **No Credentials Required**: The system is self-contained with offline institutional indexes and local fallback logic. No third-party database logins or proprietary subscriptions are needed to run and verify the submission.
