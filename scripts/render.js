#!/usr/bin/env node
/**
 * Standalone Video Renderer
 *
 * Called by AI agents (Claude Code, Gemini CLI, Codex) to render a video
 * from pre-generated content JSON.
 *
 * Usage:
 *   node scripts/render.js --number 42 [--voice] [--voice-preset aiden_calm] [--platform youtube] [--env prod]
 *   node scripts/render.js --number 42 --platform youtube --platform meta --voice
 *
 * Prerequisites:
 *   - output_prod/q{N}_content.json must exist
 *   - output_prod/q{N}_metadata.json must exist
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { getArg, hasFlag } = require('../utils/cli');
const { OUT_DIR } = require('../utils/env');
const { assembleVideo, assembleScenesVideo } = require('./assembler');

const NUMBER = parseInt(getArg('--number'), 10);
if (!NUMBER) {
  console.error('Usage: node scripts/render.js --number <N> [--voice] [--platform youtube|meta]');
  process.exit(1);
}

const USE_VOICE = hasFlag('--voice');
const VOICE_PRESET = getArg('--voice-preset') || 'aiden_calm';
const USE_HOOK = hasFlag('--hook');
const ANIM_STYLE = getArg('--anim') || 'highlight';

// Collect platforms (default: youtube + meta)
const platforms = [];
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--platform' && args[i + 1]) {
    platforms.push(...args[i + 1].split(','));
  }
}
if (platforms.length === 0) platforms.push('youtube', 'meta');

async function renderScenes(scenesPath) {
  const scenesJson = JSON.parse(fs.readFileSync(scenesPath, 'utf8'));
  const metaPath = path.join(OUT_DIR, `q${NUMBER}_metadata.json`);
  const metadata = fs.existsSync(metaPath) ? JSON.parse(fs.readFileSync(metaPath, 'utf8')) : {};

  const totalFrames = scenesJson.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
  const totalSeconds = (totalFrames / 30).toFixed(1);

  console.log('');
  console.log('=== Dynamic Scene Renderer ===');
  console.log(`  Question : #${NUMBER}`);
  console.log(`  Title    : ${scenesJson.meta?.title}`);
  console.log(`  Scenes   : ${scenesJson.scenes.length}`);
  console.log(`  Duration : ${totalSeconds}s (${totalFrames} frames)`);
  console.log(`  Platforms: ${platforms.join(', ')}`);
  console.log(`  Voice    : ${USE_VOICE ? VOICE_PRESET : 'disabled'}`);
  console.log('');

  // Voice generation
  let voiceManifest = null;
  if (USE_VOICE) {
    const contentPath = path.join(OUT_DIR, `q${NUMBER}_content.json`);
    if (fs.existsSync(contentPath)) {
      console.log('Generating voiceover...');
      const pythonBin = path.join(__dirname, '..', '.venv-qwen', 'bin', 'python');
      const voiceScript = path.join(__dirname, 'generate_voice.py');
      if (fs.existsSync(pythonBin)) {
        await new Promise((resolve, reject) => {
          const proc = spawn(pythonBin, [
            voiceScript, '--question', String(NUMBER),
            '--content', contentPath, '--voice', VOICE_PRESET,
          ], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
          proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Voice gen failed (exit ${code})`)));
          proc.on('error', reject);
        });
        const manifestPath = path.join(__dirname, '..', 'voice_output', `q${NUMBER}_manifest.json`);
        if (fs.existsSync(manifestPath)) {
          voiceManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        }
      }
    }
  }

  const results = {};
  for (const platform of platforms) {
    console.log(`\nRendering for ${platform.toUpperCase()}...`);
    const result = await assembleScenesVideo(scenesJson, metadata, NUMBER, {
      platform,
      voiceManifest,
      domain: scenesJson.meta?.title,
    });
    results[platform] = result.videoPath;
    console.log(`Done: ${result.videoPath}`);
  }

  console.log('\n=== Render Complete ===');
  for (const [plat, p] of Object.entries(results)) {
    console.log(`  ${plat}: ${p}`);
  }
}

async function main() {
  // ── Check for scenes-based video (new dynamic system) ──
  const scenesPath = path.join(OUT_DIR, `q${NUMBER}_scenes.json`);
  if (fs.existsSync(scenesPath)) {
    return await renderScenes(scenesPath);
  }

  // ── Legacy: content JSON + design JSON ──
  const contentPath = path.join(OUT_DIR, `q${NUMBER}_content.json`);
  const metaPath = path.join(OUT_DIR, `q${NUMBER}_metadata.json`);

  if (!fs.existsSync(contentPath)) {
    console.error(`Content JSON not found: ${contentPath}`);
    console.error('The AI agent should generate this file before calling render.');
    process.exit(1);
  }

  if (!fs.existsSync(metaPath)) {
    console.error(`Metadata JSON not found: ${metaPath}`);
    console.error('The AI agent should generate this file before calling render.');
    process.exit(1);
  }

  const contentJson = JSON.parse(fs.readFileSync(contentPath, 'utf8'));
  const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  // Load design JSON (agent-generated visual decisions)
  const designPath = path.join(OUT_DIR, `q${NUMBER}_design.json`);
  let designJson = null;
  if (fs.existsSync(designPath)) {
    designJson = JSON.parse(fs.readFileSync(designPath, 'utf8'));
    console.log(`  Design  : loaded (${designJson.diagrams?.nodeStyle || 'default'} nodes, ${designJson.animations?.intro?.type || 'default'} intro)`);
  } else {
    console.log('  Design  : none (using defaults)');
  }

  console.log('');
  console.log('=== Video Renderer ===');
  console.log(`  Question : #${NUMBER}`);
  console.log(`  Topic    : ${contentJson.topic}`);
  console.log(`  Domain   : ${contentJson.domain || 'GCP'}`);
  console.log(`  Sections : ${contentJson.answer_sections?.length}`);
  console.log(`  Diagrams : ${contentJson.diagrams?.length}`);
  console.log(`  Platforms: ${platforms.join(', ')}`);
  console.log(`  Voice    : ${USE_VOICE ? VOICE_PRESET : 'disabled'}`);
  console.log('');

  // Voice generation
  let voiceManifest = null;
  if (USE_VOICE) {
    console.log('Generating voiceover with Qwen3 TTS...');
    const pythonBin = path.join(__dirname, '..', '.venv-qwen', 'bin', 'python');
    const voiceScript = path.join(__dirname, 'generate_voice.py');

    if (!fs.existsSync(pythonBin)) {
      console.error(`Python venv not found: ${pythonBin}`);
      console.error('Set up .venv-qwen with mlx-audio installed.');
      process.exit(1);
    }

    await new Promise((resolve, reject) => {
      const proc = spawn(pythonBin, [
        voiceScript, '--question', String(NUMBER),
        '--content', contentPath, '--voice', VOICE_PRESET,
      ], { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
      proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Voice gen failed (exit ${code})`)));
      proc.on('error', reject);
    });

    const manifestPath = path.join(__dirname, '..', 'voice_output', `q${NUMBER}_manifest.json`);
    if (fs.existsSync(manifestPath)) {
      voiceManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      console.log(`Voice: ${voiceManifest.segments.length} segments, ${voiceManifest.total_duration_seconds}s`);
    } else {
      console.error('Voice manifest not found after generation!');
      process.exit(1);
    }
  }

  // Native Remotion diagrams (no PNG rendering needed)
  const diagrams = (contentJson.diagrams || []).map(d => ({ ...d, isNative: true }));

  // Render for each platform
  const results = {};
  for (const platform of platforms) {
    console.log(`\nRendering for ${platform.toUpperCase()}...`);
    const result = await assembleVideo(contentJson, diagrams, metadata, NUMBER, true, {
      animStyle: ANIM_STYLE,
      pauseFrames: 30,
      useHook: USE_HOOK,
      platform,
      voiceManifest,
    }, designJson);
    results[platform] = result.videoPath;
    console.log(`Done: ${result.videoPath}`);
  }

  console.log('\n=== Render Complete ===');
  for (const [plat, p] of Object.entries(results)) {
    console.log(`  ${plat}: ${p}`);
  }
}

main().catch(err => {
  console.error('Render failed:', err.message);
  process.exit(1);
});
