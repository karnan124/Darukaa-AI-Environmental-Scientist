import { Router } from 'express';
import { environmentalScientistService } from './scientist.js';
import { knowledgeBaseService } from './knowledge_base.js';
import { naturalLanguageExtractor } from './extractor.js';
import { conversationMemoryManager } from './memory.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Darukaa AI Environmental Scientist',
  });
});

// POST /api/chat
apiRouter.post('/chat', async (req, res) => {
  try {
    const { sessionId, text, structuredContext, forceAnalyze } = req.body || {};
    const result = await environmentalScientistService.processInput({
      sessionId: sessionId || 'default',
      text: typeof text === 'string' ? text : undefined,
      structuredContext,
      forceAnalyze: Boolean(forceAnalyze),
    });

    res.json({
      success: true,
      message: result.message,
      context: result.context,
      analysis: result.analysis || null,
      history: conversationMemoryManager.getMessages(sessionId || 'default'),
    });
  } catch (error: any) {
    console.error('API /chat error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to process environmental inquiry',
    });
  }
});

// POST /api/analyze
apiRouter.post('/analyze', async (req, res) => {
  try {
    const { environment, question, sessionId } = req.body || {};
    const sid = sessionId || 'default';

    const result = await environmentalScientistService.processInput({
      sessionId: sid,
      text: question || 'Comprehensive environmental assessment and evidence-backed recommendations',
      structuredContext: environment,
      forceAnalyze: true,
    });

    res.json({
      success: true,
      summary: result.analysis?.summary || '',
      missing_information: result.analysis?.missing_information || [],
      environmental_assessment: result.analysis?.environmental_assessment || [],
      interactions: result.analysis?.interactions || [],
      recommendations: result.analysis?.recommendations || [],
      sources: result.analysis?.sources || [],
      context_snapshot: result.context,
    });
  } catch (error: any) {
    console.error('API /analyze error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to execute environmental analysis',
    });
  }
});

// POST /api/knowledge/search
apiRouter.post('/knowledge/search', (req, res) => {
  try {
    const { query, variables, limit } = req.body || {};
    const q = typeof query === 'string' ? query : '';
    const vars = Array.isArray(variables) ? variables : [];
    const lim = typeof limit === 'number' ? limit : 4;

    const results = knowledgeBaseService.search(q, vars, lim);
    res.json({
      success: true,
      query: q,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('API /knowledge/search error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to search knowledge base',
    });
  }
});

// GET /api/knowledge/stats
apiRouter.get('/knowledge/stats', (_req, res) => {
  try {
    const stats = knowledgeBaseService.getStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error('API /knowledge/stats error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch knowledge base stats',
    });
  }
});

// GET /api/knowledge/documents
apiRouter.get('/knowledge/documents', (_req, res) => {
  try {
    const docs = knowledgeBaseService.getAllKnowledge();
    res.json({
      success: true,
      documents: docs,
      count: docs.length,
    });
  } catch (error: any) {
    console.error('API /knowledge/documents error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch knowledge documents',
    });
  }
});

// POST /api/extract
apiRouter.post('/extract', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, error: 'Text prompt is required' });
      return;
    }

    const result = await naturalLanguageExtractor.extract(text);
    res.json({
      success: true,
      context: result.context,
      extractedFields: result.extractedFields,
    });
  } catch (error: any) {
    console.error('API /extract error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to extract environmental parameters',
    });
  }
});

// POST /api/demo
apiRouter.post('/demo', async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    const sid = sessionId || 'demo_session';

    conversationMemoryManager.resetSession(sid);

    const demoContext = {
      location: { region: 'semi-arid', latitude: null, longitude: null },
      soil: { ph: 7.2, organic_carbon_percent: 0.3, moisture_percent: 8.5 },
      land: { land_use: 'agricultural', crop: 'wheat', cropping_system: 'monoculture', habitat_fragmentation: 'moderate' },
      biodiversity: { species_richness: 'low', habitat_diversity: 'low', pollinator_diversity: 'severely low' },
      climate: { temperature_c: 28, rainfall_mm: 310, rainfall_pattern: 'low', water_availability: 'scarce' },
      human_impact: { pollution_level: 'moderate', deforestation_pressure: 'low' },
    };

    const result = await environmentalScientistService.processInput({
      sessionId: sid,
      text: 'My biodiversity is declining on my wheat farm. The soil organic carbon is 0.3%, rainfall is low and the region is semi-arid.',
      structuredContext: demoContext,
      forceAnalyze: true,
    });

    res.json({
      success: true,
      demoName: 'Darukaa Official Hackathon Benchmark Scenario',
      context: result.context,
      analysis: result.analysis,
      history: conversationMemoryManager.getMessages(sid),
    });
  } catch (error: any) {
    console.error('API /demo error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to run demo scenario',
    });
  }
});

// POST /api/memory/reset
apiRouter.post('/memory/reset', (req, res) => {
  try {
    const { sessionId } = req.body || {};
    conversationMemoryManager.resetSession(sessionId || 'default');
    res.json({
      success: true,
      message: 'Session context reset successfully',
    });
  } catch (error: any) {
    console.error('API /memory/reset error:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to reset memory',
    });
  }
});
