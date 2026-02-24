#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   GCP Daily Interview Questions — Video Automation Pipeline  ║
 * ║                                                              ║
 * ║   PHASE 1 (now):  Gemini CLI (free)                         ║
 * ║   PHASE 2 (later): Ollama local / Claude Code               ║
 * ║   PHASE 3 (prod):  Anthropic API + full Remotion render      ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node pipeline.js --topic "Cloud Run vs GKE" --number 14
 *   node pipeline.js --topic "BigQuery partitioning" --number 15 --provider ollama
 *   node pipeline.js --dry-run   ← generates JSON only, no video render
 *
 * Provider override:
 *   LLM_PROVIDER=gemini node pipeline.js ...
 *   LLM_PROVIDER=ollama OLLAMA_MODEL=llama3.1 node pipeline.js ...
 *   LLM_PROVIDER=claude node pipeline.js ...
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { askJSON } = require('./providers/llm');
const { contentPrompt, dslRefinementPrompt, mermaidDslRefinementPrompt, metadataPrompt } = require('./prompts/index');
const { renderAllDiagrams } = require('./scripts/diagrams');
const { assembleVideo } = require('./scripts/assembler');

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const hasFlag = (flag) => args.includes(flag);

const TOPIC = getArg('--topic') || 'Cloud Dataflow and BigQuery ETL pipeline';
const NUMBER = parseInt(getArg('--number') || '14', 10);
const DRY_RUN = hasFlag('--dry-run');
const USE_REMOTION = hasFlag('--remotion');
const DIAGRAM_MODE = getArg('--diagrams') || 'excalidraw'; // 'excalidraw' or 'mermaid'
const PROVIDER = getArg('--provider') || process.env.LLM_PROVIDER || 'gemini';
const ANIM_STYLE = getArg('--anim') || 'highlight'; // 'highlight', 'type', 'fade'
const PAUSE_FRAMES = parseInt(getArg('--pause') || '30', 10);
const NO_PROGRESS = hasFlag('--no-progress');

// Override provider from CLI flag
if (getArg('--provider')) process.env.LLM_PROVIDER = PROVIDER;

const OUT_DIR = path.join(__dirname, 'output');
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Pipeline ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   GCP Video Pipeline Starting                    ║');
  console.log(`║   Provider : ${PROVIDER.padEnd(34)}║`);
  console.log(`║   Topic    : ${TOPIC.substring(0, 34).padEnd(34)}║`);
  console.log(`║   Question : #${String(NUMBER).padEnd(33)}║`);
  console.log(`║   Dry Run  : ${String(DRY_RUN).padEnd(34)}║`);
  console.log(`║   Remotion : ${String(USE_REMOTION).padEnd(34)}║`);
  console.log(`║   Diagrams : ${DIAGRAM_MODE.padEnd(34)}║`);
  console.log(`║   AnimStyle: ${ANIM_STYLE.padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── STEP 1: Content Generation ──────────────────────────────────────────────
  console.log('📝 STEP 1/4 — Generating content with LLM...');
  const contentJson = await askJSON(contentPrompt(NUMBER, TOPIC));

  const contentPath = path.join(OUT_DIR, `q${NUMBER}_content.json`);
  fs.writeFileSync(contentPath, JSON.stringify(contentJson, null, 2));
  console.log(`✅ Content saved: ${contentPath}`);
  console.log(`   Sections: ${contentJson.answer_sections?.length}`);
  console.log(`   Diagrams: ${contentJson.diagrams?.length}`);

  if (DRY_RUN) {
    console.log('\n🏁 Dry run complete. Content JSON ready.');
    console.log('   Re-run without --dry-run to render video.');
    return;
  }

  // ── STEP 2: Refine DSL for each diagram ─────────────────────────────────────
  console.log('\n📐 STEP 2/4 — Refining diagram DSL...');
  for (let i = 0; i < contentJson.diagrams.length; i++) {
    const diagram = contentJson.diagrams[i];
    const section = contentJson.answer_sections.find(s => s.id === diagram.section_id);
    console.log(`  Diagram ${i + 1}/${contentJson.diagrams.length}: ${diagram.title}`);

    // Use the correct refinement prompt based on diagram mode
    const refinePrompt = DIAGRAM_MODE === 'mermaid'
      ? mermaidDslRefinementPrompt(diagram, section?.text || '')
      : dslRefinementPrompt(diagram, section?.text || '');

    const refinedDsl = await askJSON(refinePrompt).catch(() => ({ dsl: diagram.dsl })); // fallback to original DSL on parse fail

    // askJSON might return string for DSL - handle both
    diagram.dsl = (typeof refinedDsl === 'string') ? refinedDsl : (refinedDsl?.dsl || diagram.dsl);
  }

  // ── STEP 3: Render diagrams → PNG ────────────────────────────────────────────
  console.log('\n🎨 STEP 3/4 — Rendering diagrams...');
  const diagrams = await renderAllDiagrams(contentJson, DIAGRAM_MODE);

  // ── STEP 4: Assemble video ───────────────────────────────────────────────────
  console.log('\n🎬 STEP 4/4 — Assembling video...');
  // Note: pass null for audio in prototype — wire up TTS here in Phase 2
  const videoPath = await assembleVideo(contentJson, diagrams, null, NUMBER, USE_REMOTION, { animStyle: ANIM_STYLE, pauseFrames: PAUSE_FRAMES, noProgress: NO_PROGRESS });

  // ── BONUS: Generate platform metadata ────────────────────────────────────────
  console.log('\n📱 Generating platform metadata...');
  const metadata = await askJSON(metadataPrompt(contentJson));
  const metaPath = path.join(OUT_DIR, `q${NUMBER}_metadata.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('🎉 Pipeline Complete!');
  console.log('─────────────────────────────────────────');
  console.log(`📄 Content JSON  : ${contentPath}`);
  console.log(`🎞️  Video          : ${videoPath}`);
  console.log(`📱 Metadata       : ${metaPath}`);
  console.log(`⏱️  Duration       : ~${((contentJson.answer_sections?.length || 3) * 6 + 6).toFixed(0)}s`);
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Review content JSON, tweak prompts if needed');
  console.log('  2. Add TTS: wire ElevenLabs/Google TTS for voiceover');
  console.log('  3. Install puppeteer for real diagram renders');
  console.log('  4. Switch to Remotion for smooth text animations');
  console.log('  5. Connect YouTube Data API for auto-posting');
}

run().catch(err => {
  console.error('\n❌ Pipeline failed:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
