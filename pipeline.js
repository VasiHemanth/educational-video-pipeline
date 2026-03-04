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
const { execSync, spawn } = require('child_process');
const { askJSON, askLatestModels } = require('./providers/llm');
const { contentPrompt, dslRefinementPrompt, mermaidDslRefinementPrompt, remotionDslRefinementPrompt, metadataPrompt } = require('./prompts/index');
const { renderAllDiagrams } = require('./scripts/diagrams');
const { assembleVideo } = require('./scripts/assembler');
const { initDB, trackVideo } = require('./scripts/db');
const { postToAllPlatforms } = require('./scripts/post');

// ── Shared utilities ─────────────────────────────────────────────────────────
const { getArg, hasFlag } = require('./utils/cli');
const { ENV_NAME, OUT_DIR } = require('./utils/env');

// ── CLI args ──────────────────────────────────────────────────────────────────
const TOPIC = getArg('--topic') || 'Cloud Dataflow and BigQuery ETL pipeline';
const NUMBER = parseInt(getArg('--number') || '14', 10);
const DRY_RUN = hasFlag('--dry-run');
const USE_REMOTION = !hasFlag('--canvas') && !hasFlag('--no-remotion');
const DIAGRAM_MODE = getArg('--diagrams') || 'remotion'; // 'excalidraw', 'mermaid', or 'remotion'
const PROVIDER = getArg('--provider') || process.env.LLM_PROVIDER || 'gemini';
const ANIM_STYLE = getArg('--anim') || 'highlight'; // 'highlight', 'type', 'fade'
const PAUSE_FRAMES = parseInt(getArg('--pause') || '30', 10);
const NO_PROGRESS = hasFlag('--no-progress');
const AUTO_POST = hasFlag('--post');
const USE_HOOK = hasFlag('--hook');
const DOMAIN = getArg('--domain') || 'GCP';
const USE_VOICE = hasFlag('--voice');  // Voice OFF by default, use --voice to enable
const VOICE_PRESET = getArg('--voice-preset') || 'happy_mentor_male';

// Platforms parsing (e.g. --platforms "youtube,meta")
const rawPlatforms = getArg('--platforms') || 'youtube';
const TARGET_PLATFORMS = rawPlatforms.split(',').map(p => p.trim().toLowerCase());

// Override provider from CLI flag
if (getArg('--provider')) process.env.LLM_PROVIDER = PROVIDER;

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── Pipeline ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   GCP Video Pipeline Starting                    ║');
  console.log(`║   Env      : ${ENV_NAME.toUpperCase().padEnd(34)}║`);
  console.log(`║   Provider : ${PROVIDER.padEnd(34)}║`);
  console.log(`║   Domain   : ${DOMAIN.substring(0, 34).padEnd(34)}║`);
  console.log(`║   Topic    : ${TOPIC.substring(0, 34).padEnd(34)}║`);
  console.log(`║   Question : #${String(NUMBER).padEnd(33)}║`);
  console.log(`║   Dry Run  : ${String(DRY_RUN).padEnd(34)}║`);
  console.log(`║   Remotion : ${String(USE_REMOTION).padEnd(34)}║`);
  console.log(`║   Diagrams : ${DIAGRAM_MODE.padEnd(34)}║`);
  console.log(`║   AnimStyle: ${ANIM_STYLE.padEnd(34)}║`);
  console.log(`║   Hook Text: ${String(USE_HOOK).padEnd(34)}║`);
  console.log(`║   Voice TTS: ${String(USE_VOICE).padEnd(34)}║`);
  console.log(`║   Voice     : ${(USE_VOICE ? VOICE_PRESET : 'disabled').padEnd(34)}║`);
  console.log(`║   Auto-Post: ${String(AUTO_POST).padEnd(34)}║`);
  console.log(`║   Output   : ${path.basename(OUT_DIR).padEnd(34)}║`);
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── INIT DB ───────────────────────────────────────────────────────────────────
  await initDB();

  // ── STEP 0: Fetch latest model list via web search ────────────────────────────
  console.log('🔍 STEP 0/4 — Fetching latest Gemini models via web search...');
  const liveModelsNote = await askLatestModels();
  if (liveModelsNote) {
    console.log('   Live models context injected into prompt.');
  } else {
    console.log('   Using hardcoded fallback model list.');
  }

  // ── STEP 1: Content Generation ──────────────────────────────────────────────
  console.log('\n📝 STEP 1/4 — Generating content with LLM...');
  const contentJson = await askJSON(contentPrompt(NUMBER, TOPIC, DOMAIN, liveModelsNote));
  contentJson.domain = DOMAIN; // inject for rendering

  // Fix nested diagrams if LLM put them inside answer_sections instead of root
  if (!contentJson.diagrams || contentJson.diagrams.length === 0) {
    contentJson.diagrams = (contentJson.answer_sections || []).flatMap(sec => sec.diagrams || []);
  }

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

  // ── STEP 1.5: Voice Generation (TTS) ────────────────────────────────────────
  let voiceManifest = null;
  if (USE_VOICE) {
    console.log('\n🎙️  STEP 1.5 — Generating voiceover with Qwen3 TTS...');
    const pythonBin = path.join(__dirname, '.venv-qwen', 'bin', 'python');
    const voiceScript = path.join(__dirname, 'scripts', 'generate_voice.py');

    if (!fs.existsSync(pythonBin)) {
      console.error(`❌ Python venv not found at: ${pythonBin}`);
      console.error('   Please set up .venv-qwen with mlx-audio installed.');
      process.exit(1);
    }

    const voiceArgs = [
      voiceScript,
      '--question', String(NUMBER),
      '--content', contentPath,
      '--voice', VOICE_PRESET,
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(pythonBin, voiceArgs, {
        cwd: __dirname,
        stdio: 'inherit',  // Stream output directly to console
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Voice generation failed with exit code ${code}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Failed to spawn voice generation: ${err.message}`));
      });
    });

    // Read the manifest
    const manifestPath = path.join(__dirname, 'voice_output', `q${NUMBER}_manifest.json`);
    if (fs.existsSync(manifestPath)) {
      voiceManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`✅ Voice manifest loaded: ${voiceManifest.segments.length} segments, ${voiceManifest.total_duration_seconds}s total`);
    } else {
      console.error('❌ Voice manifest not found after generation!');
      process.exit(1);
    }
  } else {
    console.log('\n⏭️  Skipping voice generation (--no-voice)');
  }

  // ── STEP 2: Refine DSL for each diagram ─────────────────────────────────────
  console.log('\n📐 STEP 2/4 — Refining diagram DSL...');
  for (let i = 0; i < contentJson.diagrams.length; i++) {
    const diagram = contentJson.diagrams[i];
    const section = contentJson.answer_sections.find(s => s.id === diagram.section_id);
    console.log(`  Diagram ${i + 1}/${contentJson.diagrams.length}: ${diagram.title}`);

    // Use the correct refinement prompt based on diagram mode
    const refinePrompt = DIAGRAM_MODE === 'mermaid'
      ? mermaidDslRefinementPrompt(diagram, section?.spoken_audio || section?.text || '', DOMAIN)
      : DIAGRAM_MODE === 'remotion'
        ? remotionDslRefinementPrompt(diagram, section?.spoken_audio || section?.text || '', DOMAIN)
        : dslRefinementPrompt(diagram, section?.spoken_audio || section?.text || '', DOMAIN);

    const refinedDsl = await askJSON(refinePrompt).catch(() => ({ dsl: diagram.dsl })); // fallback to original DSL on parse fail

    // askJSON might return string for DSL, or JSON object for remotion
    diagram.dsl = (DIAGRAM_MODE === 'remotion' && typeof refinedDsl === 'object' && !refinedDsl.dsl)
      ? JSON.stringify(refinedDsl)
      : (typeof refinedDsl === 'string') ? refinedDsl : (refinedDsl?.dsl || diagram.dsl);
  }

  // ── STEP 3: Render diagrams → PNG (Skip if remotion native) ────────────────────────────────────────────
  console.log('\n🎨 STEP 3/4 — Rendering diagrams...');
  let diagrams = [];
  if (DIAGRAM_MODE === 'remotion') {
    console.log('   Skipping PNG render (using native Remotion diagrams)...');
    diagrams = contentJson.diagrams.map(d => ({ ...d, isNative: true }));
  } else {
    diagrams = await renderAllDiagrams(contentJson, DIAGRAM_MODE);
  }

  // ── BONUS: Generate platform metadata BEFOREHAND for thumbnail ────────────────────────────────────────
  console.log('\n📱 Generating platform metadata...');
  const metadata = await askJSON(metadataPrompt(contentJson, DOMAIN));
  const metaPath = path.join(OUT_DIR, `q${NUMBER}_metadata.json`);
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));

  // ── STEP 4: Assemble video(s) ────────────────────────────────────────────────
  console.log('\n🎬 STEP 4/4 — Assembling video(s)...');
  // Note: pass null for audio in prototype — wire up TTS here in Phase 2

  const renderedVideos = {}; // Record of platform -> filePath
  let lastThumbnailPath = null;

  for (const platform of TARGET_PLATFORMS) {
    console.log(`\n   ⚙️  Building for platform: ${platform.toUpperCase()}`);
    const result = await assembleVideo(contentJson, diagrams, metadata, NUMBER, USE_REMOTION, {
      animStyle: ANIM_STYLE,
      pauseFrames: PAUSE_FRAMES,
      noProgress: NO_PROGRESS,
      useHook: USE_HOOK,
      platform: platform,
      voiceManifest: voiceManifest,  // Pass voice data to assembler
    });
    renderedVideos[platform] = result.videoPath;
    lastThumbnailPath = result.thumbnailPath;
  }

  // ── TRACK IN DB ─────────────────────────────────────────────────────────────
  console.log('\n💾 Tracking video in database...');
  const allConcepts = [...new Set([
    ...(contentJson.answer_sections || []).map(s => s.keywords?.tech_terms || []).flat(),
    ...(contentJson.answer_sections || []).map(s => s.keywords?.concepts || []).flat()
  ])];
  const firstVideoPath = Object.values(renderedVideos)[0];
  const videoId = await trackVideo(DOMAIN, TOPIC, NUMBER, contentJson.question_text || "", allConcepts, null, path.basename(firstVideoPath));

  if (AUTO_POST) {
    console.log('\n🚀 Auto-posting flag detected! Triggering social uploads...');
    await postToAllPlatforms(videoId, renderedVideos, metadata, lastThumbnailPath);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n');
  console.log('🎉 Pipeline Complete!');
  console.log('─────────────────────────────────────────');
  console.log(`📄 Content JSON  : ${contentPath}`);
  for (const [plat, pth] of Object.entries(renderedVideos)) {
    console.log(`🎞️  Video (${plat.padEnd(7)}): ${pth}`);
  }
  console.log(`📱 Metadata       : ${metaPath}`);
  console.log(`⏱️  Duration       : ~${((contentJson.answer_sections?.length || 3) * 6 + 6).toFixed(0)}s`);
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log('Quick actions:');
  console.log('  • Re-upload:  npm run upload -- --number ' + NUMBER);
  console.log('  • Thumbnail:  npm run thumbnail ' + NUMBER);
  console.log('  • Token check: npm run token:check');
}

run().catch(err => {
  console.error('\n❌ Pipeline failed:', err.message);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
