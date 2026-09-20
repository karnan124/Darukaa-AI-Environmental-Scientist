import fs from 'node:fs';
import path from 'node:path';
import type { RetrievedEvidence } from '../src/types/environmental.js';

export interface DocumentChunk {
  id: string;
  doc_id: string;
  title: string;
  source: string;
  organization: string;
  year: number;
  url: string;
  topic: string;
  variables: string[];
  content: string;
  chunk_index: number;
  tokens: Set<string>;
  term_frequencies: Map<string, number>;
}

export class KnowledgeBaseService {
  private documents: RetrievedEvidence[] = [];
  private chunks: DocumentChunk[] = [];
  private idfMap: Map<string, number> = new Map();
  private isInitialized = false;

  constructor(private seedPath?: string) {
    if (!this.seedPath) {
      this.seedPath = path.resolve(process.cwd(), 'data/seed/environmental_knowledge.json');
    }
  }

  public initialize(): void {
    if (this.isInitialized) return;

    try {
      if (fs.existsSync(this.seedPath!)) {
        const raw = fs.readFileSync(this.seedPath!, 'utf-8');
        this.documents = JSON.parse(raw);
      } else {
        console.warn(`Seed file not found at ${this.seedPath}, initializing with fallback empty set.`);
        this.documents = [];
      }
    } catch (err) {
      console.error('Error loading environmental knowledge base:', err);
      this.documents = [];
    }

    this.processAndIndexChunks();
    this.isInitialized = true;
  }

  private cleanAndTokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\d.-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  private processAndIndexChunks(): void {
    this.chunks = [];
    const docCount = this.documents.length;
    const documentFrequencies = new Map<string, number>();

    this.documents.forEach((doc, docIdx) => {
      // Clean and chunk if text is long, or keep full paragraph chunk preserving complete context
      const text = doc.content;
      const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);

      paragraphs.forEach((p, pIdx) => {
        const chunkText = p.trim();
        const tokens = this.cleanAndTokenize(`${doc.title} ${doc.topic} ${doc.variables.join(' ')} ${chunkText}`);
        const tokenSet = new Set(tokens);
        const termFreqs = new Map<string, number>();

        for (const token of tokens) {
          termFreqs.set(token, (termFreqs.get(token) || 0) + 1);
        }

        for (const token of tokenSet) {
          documentFrequencies.set(token, (documentFrequencies.get(token) || 0) + 1);
        }

        this.chunks.push({
          id: `${doc.id}_chunk_${pIdx}`,
          doc_id: doc.id,
          title: doc.title,
          source: doc.source,
          organization: doc.organization,
          year: doc.year,
          url: doc.url,
          topic: doc.topic,
          variables: doc.variables || [],
          content: chunkText,
          chunk_index: pIdx,
          tokens: tokenSet,
          term_frequencies: termFreqs,
        });
      });
    });

    // Compute IDF
    const totalChunks = Math.max(1, this.chunks.length);
    documentFrequencies.forEach((df, term) => {
      this.idfMap.set(term, Math.log((totalChunks + 1) / (df + 1)) + 1);
    });
  }

  public search(query: string, activeVariables: string[] = [], limit = 4): RetrievedEvidence[] {
    this.initialize();

    const queryTokens = this.cleanAndTokenize(query);
    const varSet = new Set(activeVariables.map((v) => v.toLowerCase().replace(/[\s-]/g, '_')));

    const scoredChunks = this.chunks.map((chunk) => {
      let score = 0;

      // 1. TF-IDF Cosine-like scoring
      for (const token of queryTokens) {
        if (chunk.tokens.has(token)) {
          const tf = chunk.term_frequencies.get(token) || 1;
          const idf = this.idfMap.get(token) || 1;
          score += (1 + Math.log(tf)) * idf;
        }
      }

      // 2. Explicit Environmental Variable matching boost
      let matchedVarsCount = 0;
      const matchedVars: string[] = [];
      for (const v of chunk.variables) {
        const cleanV = v.toLowerCase().replace(/[\s-]/g, '_');
        if (varSet.has(cleanV) || query.toLowerCase().includes(v.toLowerCase())) {
          score += 4.5;
          matchedVarsCount++;
          matchedVars.push(v);
        }
      }

      // 3. Domain specificity heuristics for dryland/semi-arid/soil carbon/monoculture
      const queryLower = query.toLowerCase();
      if (queryLower.includes('semi-arid') || queryLower.includes('arid')) {
        if (chunk.content.toLowerCase().includes('semi-arid') || chunk.content.toLowerCase().includes('dryland')) {
          score += 3.0;
        }
      }
      if (queryLower.includes('wheat') && chunk.content.toLowerCase().includes('wheat')) {
        score += 3.0;
      }
      if (queryLower.includes('carbon') && chunk.variables.includes('soil_organic_carbon')) {
        score += 3.5;
      }

      // Generate "Why relevant" explanation
      let whyRelevant = `Matches scientific criteria on ${chunk.topic}.`;
      if (matchedVars.length > 0) {
        whyRelevant = `Directly addresses environmental indicators: ${matchedVars.join(', ')} with peer-reviewed data from ${chunk.organization}.`;
      } else if (queryTokens.length > 0) {
        whyRelevant = `Provides authoritative assessment of ${chunk.topic} relevant to observed ecosystem stresses.`;
      }

      const normalizedScore = Math.min(0.99, Number((score / (score + 10)).toFixed(3)));

      return {
        chunk,
        score: normalizedScore,
        whyRelevant,
      };
    });

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // Filter duplicates by doc_id to present diverse high-quality evidence
    const seenDocs = new Set<string>();
    const results: RetrievedEvidence[] = [];

    for (const item of scoredChunks) {
      if (!seenDocs.has(item.chunk.doc_id)) {
        seenDocs.add(item.chunk.doc_id);
        results.push({
          id: item.chunk.doc_id,
          title: item.chunk.title,
          source: item.chunk.source,
          organization: item.chunk.organization,
          year: item.chunk.year,
          url: item.chunk.url,
          topic: item.chunk.topic,
          variables: item.chunk.variables,
          content: item.chunk.content,
          relevance_score: item.score,
          why_relevant: item.whyRelevant,
        });
      }
      if (results.length >= limit) break;
    }

    return results;
  }

  public getAllKnowledge(): RetrievedEvidence[] {
    this.initialize();
    return this.documents;
  }

  public getStats() {
    this.initialize();
    return {
      totalDocuments: this.documents.length,
      totalChunks: this.chunks.length,
      organizations: Array.from(new Set(this.documents.map((d) => d.organization))),
      topics: Array.from(new Set(this.documents.map((d) => d.topic))),
      coveredVariables: Array.from(new Set(this.documents.flatMap((d) => d.variables))),
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
