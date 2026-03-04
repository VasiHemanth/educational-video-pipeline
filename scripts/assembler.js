/**
 * Video Assembler  v3.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Remotion-based video assembly. Generates props JSON, invokes Remotion CLI
 * to render MP4, and generates thumbnails.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { OUT_DIR } = require('../utils/env');

// ── Output dirs ───────────────────────────────────────────────────────────────
const DIRS = {
  frames: path.join(OUT_DIR, 'frames'),
  video: path.join(OUT_DIR, 'video'),
  audio: path.join(OUT_DIR, 'audio'),
  thumbnails: path.join(OUT_DIR, 'thumbnails'),
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));


// ══════════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER (REMOTION BASED)
// ══════════════════════════════════════════════════════════════════════════════
async function assembleVideo(content, diagrams, metadata, questionNum, useRemotion = false, config = {}) {
  const domainSlug = (content.domain || 'GCP').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
  const topicSlug = (content.topic || 'video').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '').slice(0, 50);
  const platformSuffix = config.platform ? `_${config.platform}` : '';
  const slug = `${domainSlug}_${topicSlug}${platformSuffix}`;
  const baseSlug = `${domainSlug}_${topicSlug}`; // Used for thumbnail to prevent duplicates
  const rawOutputPath = path.join(DIRS.video, `raw_q${questionNum}_${slug}.mp4`);
  const finalOutputPath = path.join(DIRS.video, `q${questionNum}_${slug}.mp4`);

  // We drop the platformSuffix from the thumbnail so it only generates once per question!
  const thumbnailPath = path.join(DIRS.thumbnails, `q${questionNum}_${baseSlug}_thumbnail.png`);

  // Encode diagrams as base64 data URIs (bypasses Remotion's static file restrictions)
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

  // Pick a random background music track
  const audioDir = path.join(__dirname, '..', 'sample_audio_files');
  let bgMusicPath = null;
  if (fs.existsSync(audioDir)) {
    const mp3s = fs.readdirSync(audioDir).filter(f => f.endsWith('.mp3'));
    if (mp3s.length > 0) {
      const randomFile = mp3s[Math.floor(Math.random() * mp3s.length)];
      const absPath = path.join(audioDir, randomFile);
      // Remotion requires data URIs or public/ folder access, encode as base64
      const b64Audio = fs.readFileSync(absPath).toString('base64');
      bgMusicPath = `data:audio/mp3;base64,${b64Audio}`;
      console.log(`  🎵 Selected background music: ${randomFile}`);
    }
  }

  // --- DYNAMIC PACING & SFX CALCULATIONS ---
  const FPS = 30;
  const targetWpm = 140;
  const fastWpm = 200;
  const voiceManifest = config.voiceManifest || null;

  // Helper: encode a local file as a base64 data URI
  const encodeFileAsDataUri = (filePath, mimeType) => {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const b64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${b64}`;
  };

  // SFX disabled
  const sfx = { whoosh: null, pop: null };

  // ── Encode voice files if manifest exists ──
  let introVoicePath = null;
  let outroVoicePath = null;
  const voiceSegmentMap = {};  // section_id -> base64 data URI

  if (voiceManifest && voiceManifest.segments) {
    console.log('  🎙️  Encoding voice files for Remotion...');
    for (const seg of voiceManifest.segments) {
      const absPath = path.join(__dirname, '..', seg.path);
      const dataUri = encodeFileAsDataUri(absPath, 'audio/wav');
      if (!dataUri) {
        console.warn(`  ⚠️  Voice file not found: ${seg.path}`);
        continue;
      }
      if (seg.key === 'intro') {
        introVoicePath = dataUri;
      } else if (seg.key === 'outro') {
        outroVoicePath = dataUri;
      } else {
        voiceSegmentMap[seg.key] = dataUri;
      }
    }
  }

  // ── Calculate intro/outro frames ──
  let introFrames;
  if (voiceManifest) {
    const introSeg = voiceManifest.segments.find(s => s.key === 'intro');
    // Audio length + 30 frame buffer (1s linger)
    introFrames = introSeg ? Math.round(introSeg.duration_seconds * FPS) + 30 : 180;
  } else {
    introFrames = config.useHook ? 75 : 180;
  }

  let outroFrames;
  if (voiceManifest) {
    const outroSeg = voiceManifest.segments.find(s => s.key === 'outro');
    outroFrames = outroSeg ? Math.round(outroSeg.duration_seconds * FPS) + 60 : 180;
  } else {
    outroFrames = 180;
  }

  let currentFrame = introFrames;
  const sectionTimings = [];

  for (const section of content.answer_sections || []) {
    const sectionId = section.id;

    // Check if this section has a diagram
    const hasDiagram = Boolean((diagrams || []).find(d => d.section_id === sectionId));

    let sectionDuration, phaseAFrames, phaseBFrames, phaseCFrames, phaseDFrames;

    // Look for audio-based duration from voice manifest
    const voiceSeg = voiceManifest?.segments?.find(s => s.key === sectionId);

    if (voiceSeg && voiceSeg.duration_seconds > 0) {
      // ── AUDIO-DRIVEN TIMING ──
      const audioDurationFrames = Math.round(voiceSeg.duration_seconds * FPS);
      // Text entry occupies ~40% of voice duration
      phaseAFrames = Math.round(audioDurationFrames * 0.4);
      phaseBFrames = 15; // 0.5s pause
      phaseCFrames = hasDiagram ? 20 : 0;
      // Dwell fills the rest of audio + 30-frame buffer for diagram linger
      phaseDFrames = Math.max(30, audioDurationFrames - phaseAFrames + 30);
      sectionDuration = phaseAFrames + phaseBFrames + phaseCFrames + phaseDFrames;
      console.log(`    Section ${sectionId}: ${voiceSeg.duration_seconds}s audio → ${sectionDuration} frames (audio-driven)`);
    } else {
      // ── WPM FALLBACK ──
      const textToMeasure = section.spoken_audio || section.text || '';
      const rawText = textToMeasure.replace(/\*/g, '');
      const wordCount = rawText.split(/\s+/).filter(x => x.length > 0).length || 1;
      phaseAFrames = Math.round((wordCount / fastWpm) * 60 * FPS);
      const totalReadingFrames = Math.round((wordCount / targetWpm) * 60 * FPS);
      phaseBFrames = 15;
      phaseCFrames = hasDiagram ? 20 : 0;
      phaseDFrames = Math.max(120, totalReadingFrames - phaseAFrames);
      sectionDuration = phaseAFrames + phaseBFrames + phaseCFrames + phaseDFrames;
      console.log(`    Section ${sectionId}: WPM estimated → ${sectionDuration} frames (fallback)`);
    }

    sectionTimings.push({
      id: sectionId,
      startFrame: currentFrame,
      durationFrames: sectionDuration,
      phaseAFrames,
      phaseBFrames,
      phaseCFrames,
      phaseDFrames,
      voicePath: voiceSegmentMap[sectionId] || null,
    });

    currentFrame += sectionDuration;
  }

  const totalFrames = currentFrame + outroFrames;

  const propsPayload = {
    content,
    diagrams: formattedDiagrams,
    config: {
      animStyle: config.animStyle || 'highlight',
      pauseFrames: config.pauseFrames || 30,
      useHook: config.useHook || false,
      bgMusicPath: bgMusicPath,
      platform: config.platform,
      introFrames,
      outroFrames,
      totalFrames,
      sectionTimings,
      introVoicePath,
      outroVoicePath,
      sfx,
    }
  };

  const propsFile = path.join(__dirname, '..', 'remotion', `props_q${questionNum}.json`);
  fs.writeFileSync(propsFile, JSON.stringify(propsPayload, null, 2));

  process.stdout.write('\n🎞️  Encoding Remotion Video → MP4...\n');

  const remotionDir = path.join(__dirname, '..', 'remotion');

  await new Promise((resolve, reject) => {
    const proc = spawn('npx', [
      'remotion', 'render', 'src/index.ts', 'MainVideo',
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

        // Extract thumbnail
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
