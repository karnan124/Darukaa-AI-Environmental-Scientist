import assert from 'node:assert';
import { knowledgeBaseService } from '../../server/knowledge_base.js';
import { naturalLanguageExtractor } from '../../server/extractor.js';
import { clarificationDetector } from '../../server/clarification.js';
import { multiMetricReasoningEngine } from '../../server/reasoning.js';
import { recommendationEngine } from '../../server/recommendations.js';
import { conversationMemoryManager } from '../../server/memory.js';
import { environmentalScientistService } from '../../server/scientist.js';
import { EMPTY_ENVIRONMENTAL_CONTEXT } from '../../src/types/environmental.js';

async function runAllTests() {
  console.log('🌱 Starting Darukaa AI Environmental Scientist Verification Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      const p = fn();
      if (p && typeof p.then === 'function') {
        return p.then(() => {
          console.log(`  ✓ ${name}`);
          passed++;
        }).catch((err) => {
          console.error(`  ✗ ${name}`);
          console.error(err);
          process.exit(1);
        });
      } else {
        console.log(`  ✓ ${name}`);
        passed++;
      }
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // 1. Environmental Input Validation
  test('1. Environmental Context Model structure has all required pillars', () => {
    const ctx = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
    assert.strictEqual(ctx.soil.organic_carbon_percent, null);
    assert.strictEqual(ctx.land.crop, null);
    assert.strictEqual(ctx.climate.rainfall_pattern, null);
    assert.strictEqual(ctx.biodiversity.species_richness, null);
    assert.strictEqual(ctx.human_impact.pollution_level, null);
    assert.strictEqual(ctx.location.region, null);
  });

  // 2. Natural Language Extraction
  await test('2. Natural Language Extractor extracts SOC, rainfall, crop, and region', async () => {
    const text = 'My biodiversity is declining on my wheat farm. The soil organic carbon is 0.3%, rainfall is low and the region is semi-arid.';
    const res = await naturalLanguageExtractor.extract(text);
    assert.strictEqual(res.context.soil?.organic_carbon_percent, 0.3);
    assert.strictEqual(res.context.land?.crop, 'wheat');
    assert.strictEqual(res.context.climate?.rainfall_pattern, 'low');
    assert.strictEqual(res.context.location?.region, 'semi-arid');
  });

  // 3. Missing Information Detection
  test('3. Clarification Detector flags missing information for vague input', () => {
    const emptyCtx = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
    const vagueQuery = 'My biodiversity is declining.';
    const result = clarificationDetector.evaluate(emptyCtx, vagueQuery, false);
    assert.strictEqual(result.needsClarification, true);
    assert.ok(result.questions.length > 0, 'Must provide clarification questions');
    assert.ok(result.missingVariables.length > 0, 'Must list missing variables');
  });

  // 4. RAG Retrieval & Relevance
  test('4. RAG semantic retrieval finds relevant FAO/IPCC evidence for semi-arid wheat SOC', () => {
    knowledgeBaseService.initialize();
    const results = knowledgeBaseService.search('wheat monoculture soil organic carbon semi-arid low rainfall', ['soil_organic_carbon', 'rainfall', 'monoculture'], 4);
    assert.ok(results.length >= 2, 'Should retrieve at least 2 relevant evidence docs');
    assert.ok(results[0].title.length > 5);
    assert.ok(results[0].relevance_score! > 0);
    assert.ok(results[0].why_relevant && results[0].why_relevant.length > 5, 'Must provide why_relevant rationale');
  });

  // 5. Source Metadata Preservation
  test('5. Source metadata preserves title, organization, year, and authentic URL', () => {
    const docs = knowledgeBaseService.getAllKnowledge();
    assert.ok(docs.length >= 8, 'Knowledge base must contain sufficient seed literature');
    for (const doc of docs) {
      assert.ok(doc.title, 'Title required');
      assert.ok(doc.organization, 'Organization required');
      assert.ok(doc.year, 'Year required');
      assert.ok(doc.url.startsWith('http'), 'Authentic URL required');
      assert.ok(doc.variables.length > 0, 'Variables required');
    }
  });

  // 6. Multi-Metric Reasoning
  test('6. Multi-Metric Reasoning links at least 3 environmental variables simultaneously', () => {
    const ctx = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
    ctx.soil.organic_carbon_percent = 0.3;
    ctx.climate.rainfall_pattern = 'low';
    ctx.land.crop = 'wheat';
    ctx.land.cropping_system = 'monoculture';
    ctx.location.region = 'semi-arid';

    const evidence = knowledgeBaseService.search('semi-arid wheat monoculture', ['soil_organic_carbon', 'rainfall'], 3);
    const interactions = multiMetricReasoningEngine.evaluateInteractions(ctx, evidence);

    assert.ok(interactions.length >= 1, 'Must detect compounding interactions');
    const primaryInteraction = interactions[0];
    assert.ok(primaryInteraction.variables.length >= 3, 'Must reason across at least 3 variables simultaneously');
    assert.ok(primaryInteraction.scientific_basis.length > 10, 'Must include scientific basis');
  });

  // 7. Recommendation Generation & Format
  test('7. Recommendation engine produces concrete actions with time horizon and confidence', () => {
    const ctx = JSON.parse(JSON.stringify(EMPTY_ENVIRONMENTAL_CONTEXT));
    ctx.soil.organic_carbon_percent = 0.3;
    ctx.climate.rainfall_pattern = 'low';
    ctx.land.crop = 'wheat';
    ctx.land.cropping_system = 'monoculture';
    ctx.location.region = 'semi-arid';

    const evidence = knowledgeBaseService.search('wheat monoculture soil organic carbon semi-arid', ['soil_organic_carbon'], 3);
    const interactions = multiMetricReasoningEngine.evaluateInteractions(ctx, evidence);
    const recs = recommendationEngine.generateRecommendations(ctx, interactions, evidence);

    assert.ok(recs.length >= 2, 'Must generate multiple evidence-backed recommendations');
    for (const rec of recs) {
      assert.ok(rec.action, 'Action required');
      assert.ok(rec.why_it_works, 'Why it works required');
      assert.ok(rec.impacted_metrics.length > 0, 'Impacted metrics required');
      assert.ok(['Short term', 'Medium term', 'Long term'].includes(rec.time_horizon), 'Valid time horizon');
      assert.ok(['High', 'Medium', 'Low'].includes(rec.confidence), 'Valid confidence');
      assert.ok(rec.limitations, 'Limitations required');
      assert.ok(rec.evidence.source_title, 'Evidence source title required');
    }
  });

  // 8. Conversation Memory Across Turns
  test('8. Multi-turn memory accumulates variables across sequential inputs', () => {
    const sid = 'test_session_multiturn';
    conversationMemoryManager.resetSession(sid);

    // Turn 1: Soil carbon
    conversationMemoryManager.updateContext(sid, { soil: { organic_carbon_percent: 0.3, ph: null, moisture_percent: null } });
    // Turn 2: Rainfall
    conversationMemoryManager.updateContext(sid, { climate: { rainfall_pattern: 'low', rainfall_mm: null, temperature_c: null, water_availability: 'scarce' } });
    // Turn 3: Crop
    conversationMemoryManager.updateContext(sid, { land: { crop: 'wheat', cropping_system: 'monoculture', land_use: 'agricultural', habitat_fragmentation: null } });

    const finalCtx = conversationMemoryManager.getContext(sid);
    assert.strictEqual(finalCtx.soil.organic_carbon_percent, 0.3);
    assert.strictEqual(finalCtx.climate.rainfall_pattern, 'low');
    assert.strictEqual(finalCtx.land.crop, 'wheat');
    assert.strictEqual(finalCtx.land.cropping_system, 'monoculture');
  });

  // 9. Mandatory End-to-End Benchmark Scenario
  await test('9. Benchmark Scenario: SOC 0.3% + low rainfall + wheat monoculture + semi-arid', async () => {
    const sid = 'benchmark_scenario';
    conversationMemoryManager.resetSession(sid);

    const result = await environmentalScientistService.processInput({
      sessionId: sid,
      text: 'My biodiversity is declining on my wheat farm. The soil organic carbon is 0.3%, rainfall is low and the region is semi-arid.',
      forceAnalyze: true,
    });

    assert.ok(result.analysis, 'Analysis must be returned');
    assert.ok(result.analysis.recommendations.length >= 2, 'Must have recommendations');
    assert.ok(result.analysis.interactions.length >= 1, 'Must have multi-variable interactions');
    assert.ok(result.analysis.sources.length >= 2, 'Must attach evidence sources');
    assert.strictEqual(result.context.soil.organic_carbon_percent, 0.3);
    assert.strictEqual(result.context.land.crop, 'wheat');
    assert.strictEqual(result.context.location.region, 'semi-arid');
  });

  console.log(`\n🎉 All ${passed}/${total} system verification tests PASSED successfully!\n`);
}

runAllTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
