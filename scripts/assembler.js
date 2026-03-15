/**
 * Video Assembler  v4.0 — Cinematic 5-Act Pipeline
 * ─────────────────────────────────────────────────────────────────────────────
 * Remotion-based video assembly. Generates props JSON, invokes Remotion CLI.
 *
 * CHANGES (v4):
 * - No longer prepends hook or appends synthesis — LLM generates ALL scenes
 * - Auto-appends identity_cta if LLM didn't include it
 * - Timing fields match EducationalTypes: phaseText, phaseVisual, phaseDwell
 * - Output key is now `sceneTimings` (matches EducationalReel)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { OUT_DIR } = require('../utils/env');
const { buildSFXTrack } = require('./sfx_scheduler');

// ── Output dirs ───────────────────────────────────────────────────────────────
const DIRS = {
  frames: path.join(OUT_DIR, 'frames'),
  video: path.join(OUT_DIR, 'video'),
  audio: path.join(OUT_DIR, 'audio'),
  thumbnails: path.join(OUT_DIR, 'thumbnails'),
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));

const SFX_FILE_CANDIDATES = {
  whoosh: ['whoosh.wav', 'whoosh.mp3'],
  whip: ['whip.wav', 'whoosh.wav', 'whoosh.mp3'],
  pop: ['pop.wav', 'pop.mp3'],
  ding: ['ding.wav', 'confirm_chime.wav', 'pop.mp3'],
  click: ['click.wav', 'tick.wav', 'typing.wav'],
  slide: ['slide.wav', 'whoosh.wav', 'whoosh.mp3'],
  pageTurn: ['page_turn.wav', 'whoosh.wav', 'whoosh.mp3'],
  uiSwitch: ['ui_switch.wav', 'tick.wav', 'typing.wav'],
  tick: ['tick.wav', 'typing.wav'],
  bass_rumble: ['bass_rumble.wav', 'whoosh.wav', 'whoosh.mp3'],
  error_buzz: ['error_buzz.wav', 'tick.wav', 'typing.wav'],
  edge_hum: ['edge_hum.wav', 'typing.wav'],
  confirm_chime: ['confirm_chime.wav', 'ding.wav', 'pop.mp3'],
};


// ══════════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER (REMOTION BASED)
// ══════════════════════════════════════════════════════════════════════════════
async function assembleVideo(content, diagrams, metadata, questionNum, useRemotion = false, config = {}) {
  const domainSlug = (content.domain || 'GCP').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
  const topicSlug = (content.topic || 'video').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '').slice(0, 50);
  const platformSuffix = config.platform ? `_${config.platform}` : '';
  const slug = `${domainSlug}_${topicSlug}${platformSuffix}`;
  const baseSlug = `${domainSlug}_${topicSlug}`;
  const rawOutputPath = path.join(DIRS.video, `raw_q${questionNum}_${slug}.mp4`);
  const finalOutputPath = path.join(DIRS.video, `q${questionNum}_${slug}.mp4`);
  const thumbnailPath = path.join(DIRS.thumbnails, `q${questionNum}_${baseSlug}_thumbnail.png`);

  // ── Encode diagrams as base64 data URIs ──
  const formattedDiagrams = (diagrams || []).map(d => {
    if (d.isNative) return d;
    let pngPath = d.png_path || d.pngPath;
    if (pngPath && fs.existsSync(pngPath)) {
      const b64 = fs.readFileSync(pngPath).toString('base64');
      pngPath = `data:image/png;base64,${b64}`;
    } else {
      console.warn(`  ⚠️  Skipping missing diagram: ${pngPath || 'unknown'}`);
      pngPath = null;
    }
    return { ...d, pngPath };
  });

  // ── Background music ──
  const audioDir = path.join(__dirname, '..', 'sample_audio_files');
  let bgMusicPath = null;
  if (fs.existsSync(audioDir)) {
    const mp3s = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    if (mp3s.length > 0) {
      const randomFile = mp3s[Math.floor(Math.random() * mp3s.length)];
      const absPath = path.join(audioDir, randomFile);
      const b64Audio = fs.readFileSync(absPath).toString('base64');
      bgMusicPath = `data:audio/mp3;base64,${b64Audio}`;
      console.log(`  🎵 Selected background music: ${randomFile}`);
    }
  }

  // ── Voice & Timing Configuration ──
  const FPS = 30;
  const targetWpm = 140;
  const fastWpm = 200;
  const voiceManifest = config.voiceManifest || null;

  const encodeFileAsDataUri = (filePath, mimeType) => {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${b64}`;
  };

  const getAudioMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.mp3') return 'audio/mpeg';
    if (ext === '.wav') return 'audio/wav';
    return 'application/octet-stream';
  };

  const resolveSfxSourceMap = (sfxDir) => {
    const sourceMap = {};

    for (const [sfxType, candidates] of Object.entries(SFX_FILE_CANDIDATES)) {
      const filePath = candidates
        .map((candidate) => path.join(sfxDir, candidate))
        .find((candidatePath) => fs.existsSync(candidatePath));

      if (!filePath) continue;

      const dataUri = encodeFileAsDataUri(filePath, getAudioMimeType(filePath));
      if (dataUri) {
        sourceMap[sfxType] = dataUri;
      }
    }

    return sourceMap;
  };

  // ── Encode voice files ──
  const voiceSegmentMap = {};
  if (voiceManifest && voiceManifest.segments) {
    console.log('  🎙️  Encoding voice files for Remotion...');
    for (const seg of voiceManifest.segments) {
      const absPath = path.join(__dirname, '..', seg.path);
      const dataUri = encodeFileAsDataUri(absPath, 'audio/wav');
      if (!dataUri) {
        console.warn(`  ⚠️  Voice file not found: ${seg.path}`);
        continue;
      }
      voiceSegmentMap[seg.key] = dataUri;
    }
  }

  // ── Build scene list ──
  // The LLM now generates ALL scenes (hook → chaos → reveal → steps)
  // We only auto-append a CTA if the LLM didn't include one
  const scenes = [...(content.scenes || [])];

  const hasCtaScene = scenes.some(s =>
    s.sceneType === 'cta' || s.sceneType === 'identity_cta'
  );

  if (!hasCtaScene) {
    scenes.push({
      id: 'cta',
      sceneType: 'identity_cta',
      title: '',
      text: content.cta_text || 'Save this for your next build 🔖',
      spokenAudio: '',
      visualFormat: 'text_only',
      visualData: null,
      keywords: {},
      accentColor: '#B026FF',
      moodColor: '#050210',
      transitionStyle: 'none',
      durationSeconds: 4,
    });
  }

  // ── Calculate per-scene timing ──
  let currentFrame = 0;
  const sceneTimings = [];

  for (const scene of scenes) {
    const sectionId = scene.id;
    const hasDiagram = scene.visualFormat === 'diagram';
    const voiceSeg = voiceManifest?.segments?.find(s => s.key === sectionId);

    let phaseText, phaseVisual, phaseDwell, phaseTransition;
    let sceneDuration;

    if (voiceSeg && voiceSeg.duration_seconds > 0) {
      // ── Voice-driven timing ──
      const audioFrames = Math.round(voiceSeg.duration_seconds * FPS);
      phaseText = Math.round(audioFrames * 0.35);
      phaseVisual = hasDiagram ? 30 : 20;
      phaseDwell = Math.max(30, audioFrames - phaseText + 24);
      phaseTransition = 12;
      sceneDuration = phaseText + phaseVisual + phaseDwell + phaseTransition;
      console.log(`    Scene ${sectionId}: ${voiceSeg.duration_seconds}s audio → ${sceneDuration} frames (voice-driven)`);
    } else {
      // ── WPM estimation (tuned for 30-second Shorts) ──
      const textToMeasure = scene.spokenAudio || scene.text || '';
      const wordCount = textToMeasure.replace(/\*/g, '').split(/\s+/).filter(x => x.length > 0).length || 1;
      phaseText = Math.round((wordCount / fastWpm) * 60 * FPS);
      const totalReadFrames = Math.round((wordCount / targetWpm) * 60 * FPS);
      phaseVisual = hasDiagram ? 24 : 12;
      phaseDwell = Math.max(45, totalReadFrames - phaseText + 15);
      phaseTransition = 8;
      sceneDuration = phaseText + phaseVisual + phaseDwell + phaseTransition;
      console.log(`    Scene ${sectionId}: WPM → ${sceneDuration} frames (${wordCount} words)`);
    }

    // Ensure minimum scene duration (no scene shorter than 2.5s)
    sceneDuration = Math.max(sceneDuration, 75);

    sceneTimings.push({
      id: sectionId,
      startFrame: currentFrame,
      durationFrames: sceneDuration,
      phaseText,
      phaseVisual,
      phaseDwell,
      phaseTransition,
      voicePath: voiceSegmentMap[sectionId] || null,
    });

    scene.durationSeconds = sceneDuration / FPS;
    currentFrame += sceneDuration;
  }

  const totalFrames = currentFrame;

  // ── Build final content ──
  const eduContent = { ...content, scenes };

  // ── Auto-Generate SFX Track ──
  const sfxSourceMap = resolveSfxSourceMap(path.join(__dirname, '..', 'sample_audio_files', 'sfx'));
  const missingSfxTypes = new Set();
  const sfxEvents = buildSFXTrack(eduContent, sceneTimings).map((event) => {
    const sourceUrl = sfxSourceMap[event.sfxType] || null;
    if (!sourceUrl) {
      missingSfxTypes.add(event.sfxType);
    }

    return {
      ...event,
      sourceUrl,
    };
  });

  if (missingSfxTypes.size > 0) {
    console.warn(`  ⚠️  Missing SFX assets for: ${Array.from(missingSfxTypes).join(', ')}`);
  }

  const propsPayload = {
    content: eduContent,
    config: {
      animStyle: config.animStyle || 'highlight',
      pauseFrames: config.pauseFrames || 30,
      bgMusicPath,
      platform: config.platform,
      totalFrames,
      sceneTimings,  // ← matches EducationalReelProps.config.sceneTimings
      sfxEvents,
      watermark: config.watermark || 'Cloud Architect',
      watermarkSub: config.watermarkSub || '',
    }
  };

  const propsFile = path.join(__dirname, '..', 'remotion', `props_q${questionNum}.json`);
  fs.writeFileSync(propsFile, JSON.stringify(propsPayload, null, 2));

  process.stdout.write('\n🎞️  Encoding Remotion Video → MP4...\n');

  const remotionDir = path.join(__dirname, '..', 'remotion');

  await new Promise((resolve, reject) => {
    const proc = spawn('npx', [
      'remotion', 'render', 'src/index.ts', 'EducationalReel',
      rawOutputPath, `--props=${propsFile}`, '-y'
    ], { cwd: remotionDir, stdio: ['ignore', 'pipe', 'pipe'] });

    proc.stderr.on('data', (data) => console.error(data.toString()));

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const totalMatch = text.match(/(\d+)\/(\d+)/);
      if (totalMatch) {
        const done = parseInt(totalMatch[1]);
        const total = parseInt(totalMatch[2]);
        if (total > 0 && !config.noProgress) {
          const pct = Math.round((done / total) * 100);
          const filled = Math.round(pct / 5);
          const bar = '▓'.repeat(filled) + '░'.repeat(20 - filled);
          process.stdout.write(`\r  Rendering [${bar}] ${pct}%  `);
        }
      }
    });

    proc.on('close', (code) => {
      if (!config.noProgress) process.stdout.write('\r  Rendering [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%  \n');
      if (code === 0) {
        fs.renameSync(rawOutputPath, finalOutputPath);
        console.log(`\n✅ Final Video ready: ${finalOutputPath}`);

        // Generate thumbnail
        if (!fs.existsSync(path.dirname(thumbnailPath))) fs.mkdirSync(path.dirname(thumbnailPath), { recursive: true });
        propsPayload.config.thumbnail_headline = metadata?.thumbnail?.headline;
        propsPayload.config.thumbnail_subheadline = metadata?.thumbnail?.subheadline;

        const thumbPropsFile = path.join(__dirname, '..', 'remotion', `thumb_props_q${questionNum}.json`);
        fs.writeFileSync(thumbPropsFile, JSON.stringify(propsPayload, null, 2));

        if (!fs.existsSync(thumbnailPath)) {
          console.log(`  📸 Generating professional thumbnail...`);
          try {
            execSync(`npx remotion still src/index.ts Thumbnail "${thumbnailPath}" --props="${thumbPropsFile}" --frame=0 -y`, {
              cwd: remotionDir,
              stdio: 'inherit'
            });
            console.log(`  ✅ Thumbnail saved: ${thumbnailPath}`);
          } catch (e) {
            console.warn(`  ⚠️ Failed to generate thumbnail:`, e.message);
          }
        }
        resolve();
      } else {
        reject(new Error(`Remotion render exited with code ${code}`));
      }
    });
  });

  return { videoPath: finalOutputPath, thumbnailPath };
}

module.exports = { assembleVideo };
