import { GoogleGenAI } from '@google/genai';
import type {
  EnvironmentalContext,
  AnalysisResponse,
  ChatMessage,
  RetrievedEvidence,
} from '../src/types/environmental.js';
import { knowledgeBaseService } from './knowledge_base.js';
import { naturalLanguageExtractor } from './extractor.js';
import { clarificationDetector } from './clarification.js';
import { conversationMemoryManager } from './memory.js';
import { multiMetricReasoningEngine } from './reasoning.js';
import { recommendationEngine } from './recommendations.js';

export interface ProcessInputParams {
  sessionId?: string;
  text?: string;
  structuredContext?: Partial<EnvironmentalContext>;
  forceAnalyze?: boolean;
}

export class EnvironmentalScientistService {
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

  public async processInput(params: ProcessInputParams): Promise<{
    message: ChatMessage;
    context: EnvironmentalContext;
    analysis?: AnalysisResponse;
  }> {
    const sessionId = params.sessionId || 'default';
    const text = params.text?.trim() || '';
    const forceAnalyze = Boolean(params.forceAnalyze);

    // 1. Natural language extraction if text provided
    const extractedFields: string[] = [];
    if (text) {
      const extracted = await naturalLanguageExtractor.extract(text);
      if (Object.keys(extracted.context).length > 0) {
        conversationMemoryManager.updateContext(sessionId, extracted.context);
        extractedFields.push(...extracted.extractedFields);
      }
    }

    // 2. Merge explicit structured input if provided
    if (params.structuredContext && Object.keys(params.structuredContext).length > 0) {
      conversationMemoryManager.updateContext(sessionId, params.structuredContext);
    }

    const currentContext = conversationMemoryManager.getContext(sessionId);

    // 3. Check for missing information / clarification needs
    const clarification = clarificationDetector.evaluate(currentContext, text, forceAnalyze);

    // 4. Record user message in memory
    if (text || params.structuredContext) {
      conversationMemoryManager.addMessage(sessionId, {
        id: `msg_user_${Date.now()}`,
        sender: 'user',
        text: text || 'Provided structured environmental context.',
        timestamp: new Date().toISOString(),
        structured_input: params.structuredContext,
        extracted_variables: extractedFields,
      });
    }

    // If critical information is missing and user didn't force full analysis:
    if (clarification.needsClarification && !forceAnalyze) {
      const clarifyText = this.buildClarificationResponse(clarification.questions, clarification.reasons, currentContext);
      const assistantMessage: ChatMessage = {
        id: `msg_asst_${Date.now()}`,
        sender: 'assistant',
        text: clarifyText,
        timestamp: new Date().toISOString(),
        is_clarification: true,
      };

      conversationMemoryManager.addMessage(sessionId, assistantMessage);

      return {
        message: assistantMessage,
        context: currentContext,
      };
    }

    // 5. Sufficient context or forced analysis: Execute Full Scientific RAG & Multi-Metric Analysis
    const activeVarKeys = this.collectActiveVariableKeys(currentContext);
    const searchQuery = `${text} ${currentContext.location.region || ''} ${currentContext.land.crop || ''} ${currentContext.land.cropping_system || ''} ${currentContext.climate.rainfall_pattern || ''}`;

    // RAG Retrieval
    const retrievedSources = knowledgeBaseService.search(searchQuery, activeVarKeys, 5);

    // Multi-metric assessment & interaction reasoning
    const assessment = multiMetricReasoningEngine.assessConditions(currentContext);
    const interactions = multiMetricReasoningEngine.evaluateInteractions(currentContext, retrievedSources);

    // Generate evidence-grounded recommendations
    const recommendations = recommendationEngine.generateRecommendations(currentContext, interactions, retrievedSources);

    // Build synthesized scientist summary
    const summary = await this.synthesizeSummary(currentContext, assessment, interactions, recommendations, retrievedSources, text);

    const activeVariablesCount = this.countActiveVariables(currentContext);

    const analysisResponse: AnalysisResponse = {
      summary,
      missing_information: clarification.missingVariables,
      clarification_needed: false,
      environmental_assessment: assessment,
      interactions,
      recommendations,
      sources: retrievedSources,
      context_snapshot: JSON.parse(JSON.stringify(currentContext)),
      active_variables_count: activeVariablesCount,
    };

    const assistantMessage: ChatMessage = {
      id: `msg_asst_${Date.now()}`,
      sender: 'assistant',
      text: summary,
      timestamp: new Date().toISOString(),
      analysis: analysisResponse,
      is_clarification: false,
    };

    conversationMemoryManager.addMessage(sessionId, assistantMessage);

    return {
      message: assistantMessage,
      context: currentContext,
      analysis: analysisResponse,
    };
  }

  private buildClarificationResponse(questions: string[], reasons: string[], context: EnvironmentalContext): string {
    let intro = 'To conduct an evidence-grounded environmental assessment, I need a few key ecosystem parameters.';
    const knownItems: string[] = [];

    if (context.soil.organic_carbon_percent !== null) knownItems.push(`Soil Organic Carbon: ${context.soil.organic_carbon_percent}%`);
    if (context.soil.ph !== null) knownItems.push(`Soil pH: ${context.soil.ph}`);
    if (context.land.crop) knownItems.push(`Crop: ${context.land.crop}`);
    if (context.land.cropping_system) knownItems.push(`System: ${context.land.cropping_system}`);
    if (context.climate.rainfall_pattern) knownItems.push(`Rainfall: ${context.climate.rainfall_pattern}`);
    if (context.location.region) knownItems.push(`Region: ${context.location.region}`);

    if (knownItems.length > 0) {
      intro += ` Currently observed: ${knownItems.join(', ')}.`;
    }

    const qLines = questions.map((q, idx) => `${idx + 1}. **${q}**\n   *Scientific purpose*: ${reasons[idx] || 'Establishes biophysical boundary conditions.'}`).join('\n\n');

    return `${intro}\n\nPlease clarify:\n\n${qLines}\n\n*(Alternatively, you can fill in the structured panel on the right or click "Run Analysis Now" to analyze with current assumptions.)*`;
  }

  private collectActiveVariableKeys(context: EnvironmentalContext): string[] {
    const keys: string[] = [];
    if (context.soil.organic_carbon_percent !== null) keys.push('soil_organic_carbon');
    if (context.soil.ph !== null) keys.push('soil_ph');
    if (context.soil.moisture_percent !== null) keys.push('soil_moisture');
    if (context.land.cropping_system) keys.push(context.land.cropping_system.toLowerCase());
    if (context.land.crop) keys.push(context.land.crop.toLowerCase());
    if (context.climate.rainfall_pattern) keys.push('rainfall', 'water_availability');
    if (context.location.region) keys.push(context.location.region.toLowerCase());
    if (context.biodiversity.pollinator_diversity) keys.push('pollinator_diversity');
    if (context.biodiversity.species_richness) keys.push('species_richness', 'biodiversity');
    return keys;
  }

  private countActiveVariables(context: EnvironmentalContext): number {
    let count = 0;
    if (context.location.region !== null) count++;
    if (context.soil.ph !== null) count++;
    if (context.soil.organic_carbon_percent !== null) count++;
    if (context.soil.moisture_percent !== null) count++;
    if (context.land.crop !== null) count++;
    if (context.land.cropping_system !== null) count++;
    if (context.land.habitat_fragmentation !== null) count++;
    if (context.biodiversity.species_richness !== null) count++;
    if (context.biodiversity.pollinator_diversity !== null) count++;
    if (context.climate.rainfall_pattern !== null) count++;
    if (context.climate.rainfall_mm !== null) count++;
    if (context.human_impact.pollution_level !== null) count++;
    return count;
  }

  private async synthesizeSummary(
    context: EnvironmentalContext,
    assessment: AnalysisResponse['environmental_assessment'],
    interactions: AnalysisResponse['interactions'],
    recommendations: AnalysisResponse['recommendations'],
    sources: RetrievedEvidence[],
    userQuery: string
  ): Promise<string> {
    // If Gemini is available, synthesize with model
    if (this.ai) {
      try {
        const prompt = `You are an AI Environmental Scientist. Synthesize a professional environmental intelligence report based strictly on the provided context and retrieved evidence.
User Query: "${userQuery}"

OBSERVED ENVIRONMENTAL VARIABLES:
${JSON.stringify(context, null, 2)}

ASSESSMENT ITEMS:
${assessment.map((a) => `- ${a.metric}: ${a.value} (${a.status}) -> ${a.interpretation}`).join('\n')}

MULTI-METRIC INTERACTIONS:
${interactions.map((i) => `- [${i.variables.join(' ↔ ')}]: ${i.description} (Scientific Basis: ${i.scientific_basis})`).join('\n')}

RECOMMENDATIONS:
${recommendations.map((r, idx) => `${idx + 1}. Action: ${r.action}\nWhy it works: ${r.why_it_works}\nTime Horizon: ${r.time_horizon}\nConfidence: ${r.confidence}\nEvidence: ${r.evidence.source_title} (${r.evidence.organization}, ${r.evidence.year})\nLimitations: ${r.limitations}`).join('\n\n')}

RETRIEVED SCIENTIFIC SOURCES:
${sources.map((s) => `- ${s.title} (${s.organization}, ${s.year}) - URL: ${s.url}`).join('\n')}

MANDATORY RULES:
1. Distinguish between USER-PROVIDED DATA, RETRIEVED SCIENTIFIC EVIDENCE, MODEL INFERENCES, and RECOMMENDATIONS.
2. Never invent quantitative improvement percentages not in the evidence.
3. Be concise, authoritative, and scientifically rigorous. No marketing fluff or generic chat greetings.`;

        const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
        for (const modelName of modelsToTry) {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const response = await this.ai.models.generateContent({
                model: modelName,
                contents: prompt,
              });

              if (response.text) {
                return response.text.trim();
              }
            } catch (err: any) {
              if (err?.status === 503 || err?.status === 429 || err?.message?.includes('503') || err?.message?.includes('high demand')) {
                await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
                continue;
              }
              break;
            }
          }
        }
      } catch {
        // Fall back gracefully to the deterministic synthesis template below
      }
    }

    // Deterministic scientific synthesis template
    const obsLines = assessment.map((a) => `• **${a.metric}**: \`${a.value}\` (${a.status.toUpperCase()}) — ${a.interpretation}`).join('\n');
    const interLines = interactions.map((i) => `• **${i.variables.join(' ↔ ')}**\n  ${i.description}\n  *Evidence basis: ${i.scientific_basis}*`).join('\n\n');
    const recLines = recommendations.map((r, idx) => `### Recommendation ${idx + 1}: ${r.action.slice(0, 70)}...
- **Action**: ${r.action}
- **Why it works**: ${r.why_it_works}
- **Impacted metrics**: ${r.impacted_metrics.join(', ')}
- **Time horizon**: ${r.time_horizon}
- **Expected impact**: ${r.expected_impact}
- **Evidence**: *${r.evidence.source_title}* (${r.evidence.organization}, ${r.evidence.year}) [Link](${r.evidence.url})
- **Confidence**: ${r.confidence}
- **Known limitations**: ${r.limitations}`).join('\n\n');

    const sourcesLines = sources.map((s, idx) => `${idx + 1}. [${s.title}](${s.url}) — **${s.organization}** (${s.year}). *Topic: ${s.topic}*`).join('\n');

    return `## Environmental Intelligence Assessment

### Observed Conditions (User-Provided Data)
${obsLines}

### Key Multi-Metric Interactions (Scientific Inferences)
${interLines}

---

## Evidence-Backed Recommendations
${recLines}

---

### Supporting Scientific Evidence
${sourcesLines}`;
  }
}

export const environmentalScientistService = new EnvironmentalScientistService();
