/**
 * Video Assembler  v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * FIXES vs v1.0:
 *  1. Corner accents — proper filled pie slices (moveTo + arc + closePath)
 *  2. Text reveal — fast ease-out (0→40% of section), then HOLDS visible
 *  3. Layout redesign — header → text zone → diagram card, zero dead space
 *  4. Intro — question text capped at 2 lines, GCP service pills added
 *  5. Timing — 4s intro + 8s/section + 3s outro ≈ 27–31s total
 *  6. Placeholder flow — actual node diagram in card instead of grey box
 *  7. Outro — corner accents + bouncing subscribe button
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// ── Canvas & timing ───────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;
const FPS = 30;

const INTRO_FRAMES = FPS * 4;   // 4 s
const SECTION_FRAMES = FPS * 8;   // 8 s per content section
const OUTRO_FRAMES = FPS * 3;   // 3 s

// Text reveal completes at this fraction of section duration, then holds
const REVEAL_END = 0.40;

// ── Layout (Y as fraction of H) ───────────────────────────────────────────────
const L = {
  header_y: 0.10,   // section header centre
  text_top: 0.155,  // body text top
  text_bottom: 0.52,   // body text bottom limit
  card_top: 0.545,  // diagram card top
  card_bottom: 0.925,  // diagram card bottom
  watermark_y: 0.967,
};

// ── Colours ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#FFFFFF',
  text: '#1A1A1A',
  blue: '#1A73E8',
  red: '#D93025',
  green: '#188038',
  yellow: '#FBBC04',
  card_bg: '#EEF2FF',
  card_bd: '#1A73E8',
  dim: '#BBBBBB',
};

// ── Font shorthand ────────────────────────────────────────────────────────────
const f = (size, bold = false, italic = false) =>
  `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px Arial`;

// ── Output dirs ───────────────────────────────────────────────────────────────
const DIRS = {
  frames: path.join(__dirname, '..', 'output_prod', 'frames'),
  video: path.join(__dirname, '..', 'output_prod', 'video'),
  audio: path.join(__dirname, '..', 'output_prod', 'audio'),
  thumbnails: path.join(__dirname, '..', 'output_prod', 'thumbnails'),
};
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));


// ══════════════════════════════════════════════════════════════════════════════
// FIX #1  CORNER ACCENTS — filled pie slices using moveTo
// ══════════════════════════════════════════════════════════════════════════════
function drawCornerAccents(ctx) {
  // Top-left green
  ctx.save();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 270, 0, Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Top-right yellow
  ctx.save();
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.moveTo(W, 0);
  ctx.arc(W, 0, 190, Math.PI / 2, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Bottom-left yellow (small)
  ctx.save();
  ctx.fillStyle = C.yellow;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.arc(0, H, 120, -Math.PI / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Bottom-right green (small)
  ctx.save();
  ctx.fillStyle = C.green;
  ctx.beginPath();
  ctx.moveTo(W, H);
  ctx.arc(W, H, 90, Math.PI, -Math.PI / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWatermark(ctx) {
  ctx.save();
  ctx.font = f(30, false, true);
  ctx.fillStyle = C.dim;
  ctx.textAlign = 'center';
  ctx.fillText('Cloud Architect by Srinivas', W / 2, H * L.watermark_y);
  ctx.restore();
}


// ══════════════════════════════════════════════════════════════════════════════
// FIX #4  INTRO FRAME — capped question, service pills
// ══════════════════════════════════════════════════════════════════════════════
function drawIntroFrame(content) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const cx = W / 2;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawCornerAccents(ctx);

  // GCP header
  ctx.font = f(108, true);
  ctx.fillStyle = C.blue;
  ctx.textAlign = 'center';
  ctx.fillText('GCP ☁', cx, 340);

  ctx.font = f(54, true);
  ctx.fillStyle = C.text;
  ctx.fillText('Daily Interview', cx, 428);
  ctx.fillText('Questions', cx, 496);

  // Divider line
  ctx.save();
  ctx.strokeStyle = C.blue;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(120, 542);
  ctx.lineTo(W - 120, 542);
  ctx.stroke();
  ctx.restore();

  // Q number
  ctx.font = f(42, true);
  ctx.fillStyle = C.red;
  ctx.fillText(`Q${content.question_number}`, cx, 612);

  // Question text — max 2 lines (fix #4)
  const qWords = (content.question_text || '').split(' ');
  ctx.font = f(38, true);
  let l1 = '', l2 = '';
  for (const w of qWords) {
    const try1 = l1 ? l1 + ' ' + w : w;
    if (!l1 || ctx.measureText(try1).width < W - 160) { l1 = try1; continue; }
    const try2 = l2 ? l2 + ' ' + w : w;
    if (!l2 || ctx.measureText(try2).width < W - 160) { l2 = try2; continue; }
    l2 = l2.trimEnd() + '…'; break;
  }
  ctx.fillStyle = C.text;
  ctx.fillText(l1, cx, 688);
  if (l2) ctx.fillText(l2, cx, 742);

  // Primary service pill
  const svcs = content.gcp_services || [];
  const primary = svcs[0] || '';
  if (primary) {
    ctx.font = f(36, true);
    const pw = Math.min(ctx.measureText(primary).width + 70, W - 200);
    const px = cx - pw / 2;
    const py = 880;
    ctx.save();
    ctx.fillStyle = C.blue;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, 72, 36);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.fillText(primary, cx, py + 48);
    ctx.restore();
  }

  // Secondary service outlines
  let tx = 80, ty = 1010;
  ctx.font = f(28);
  for (const svc of svcs.slice(1, 5)) {
    const tw = ctx.measureText(svc).width + 36;
    if (tx + tw > W - 80) break;
    ctx.save();
    ctx.strokeStyle = C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tw, 50, 25);
    ctx.stroke();
    ctx.fillStyle = C.blue;
    ctx.textAlign = 'left';
    ctx.fillText(svc, tx + 18, ty + 33);
    ctx.restore();
    tx += tw + 16;
  }

  drawWatermark(ctx);
  return canvas.toBuffer('image/png');
}


// ══════════════════════════════════════════════════════════════════════════════
// HIGHLIGHTED TEXT  (word-by-word colour + proper word-wrap)
// ══════════════════════════════════════════════════════════════════════════════
function drawHighlightedText(ctx, text, keywords, x, y, maxW, lineH, fontSize = 44) {
  if (!text.trim()) return;

  const gcp = (keywords?.gcp_services || []).map(k => k.toLowerCase());
  const verbs = (keywords?.action_verbs || []).map(k => k.toLowerCase());
  const concs = (keywords?.concepts || []).map(k => k.toLowerCase());

  const colorFor = (raw) => {
    const w = raw.replace(/[.,;:!?()\[\]]/g, '').toLowerCase();
    if (gcp.some(k => (w.includes(k) || k.includes(w)) && w.length > 2)) return { col: C.blue, b: true };
    if (verbs.some(k => k === w)) return { col: C.red, b: true };
    if (concs.some(k => (w.includes(k) || k.includes(w)) && w.length > 2)) return { col: C.green, b: false };
    return { col: C.text, b: false };
  };

  const mw = (word, bold) => {
    ctx.font = f(fontSize, bold);
    return ctx.measureText(word + ' ').width;
  };

  let curX = x, curY = y;
  const maxY = H * L.text_bottom;

  for (const word of text.split(' ')) {
    const { col, b } = colorFor(word);
    const ww = mw(word, b);

    if (curX + ww > x + maxW && curX > x) {
      curX = x;
      curY += lineH;
      if (curY > maxY) break;  // overflow guard
    }

    ctx.font = f(fontSize, b);
    ctx.fillStyle = col;
    ctx.textAlign = 'left';
    ctx.fillText(word + ' ', curX, curY);
    curX += ww;
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// PLACEHOLDER FLOW — visible node diagram when real PNG not available
// ══════════════════════════════════════════════════════════════════════════════
function drawPlaceholderFlow(ctx, cardX, cardY, cardW, cardH, content) {
  const services = (content.gcp_services || ['Source', 'Process', 'Store']).slice(0, 4);
  const nodeW = 190, nodeH = 66;
  const totalNodesW = services.length * nodeW + (services.length - 1) * 30;
  const startX = cardX + (cardW - totalNodesW) / 2;
  const centerY = cardY + cardH / 2 + 10;

  services.forEach((label, i) => {
    const nx = startX + i * (nodeW + 30);
    const ny = centerY - nodeH / 2;

    const isFirst = i === 0;
    const isLast = i === services.length - 1;

    ctx.save();
    ctx.fillStyle = isFirst ? C.blue : isLast ? C.green : '#F5F5F5';
    ctx.strokeStyle = isFirst ? C.blue : isLast ? C.green : C.blue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(nx, ny, nodeW, nodeH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = f(26, true);
    ctx.fillStyle = (isFirst || isLast) ? '#FFF' : C.text;
    ctx.textAlign = 'center';
    const short = label.length > 13 ? label.slice(0, 12) + '…' : label;
    ctx.fillText(short, nx + nodeW / 2, ny + 42);
    ctx.restore();

    // Arrow
    if (i < services.length - 1) {
      const ax = nx + nodeW + 2;
      const ay = centerY;
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + 26, ay);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.moveTo(ax + 30, ay);
      ctx.lineTo(ax + 18, ay - 9);
      ctx.lineTo(ax + 18, ay + 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// FIX #2 + #3  CONTENT FRAME — reveal + layout
// ══════════════════════════════════════════════════════════════════════════════
function drawContentFrame(section, diagram, progress, content, diagramImage = null) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawCornerAccents(ctx);

  // Section header
  ctx.font = f(44, true);
  ctx.fillStyle = C.red;
  ctx.textAlign = 'center';
  ctx.fillText(`✦  ${section.title}  ✦`, W / 2, H * L.header_y);

  // ── FIX #2: ease-out reveal in first REVEAL_END of section, then hold ─────
  const rawT = Math.min(progress / REVEAL_END, 1.0);
  const eased = 1 - (1 - rawT) * (1 - rawT);     // ease-out quad
  const words = (section.text || '').split(' ');
  const nWords = Math.max(1, Math.floor(words.length * eased));
  const visible = words.slice(0, nWords).join(' ');

  // Body text
  drawHighlightedText(
    ctx, visible, section.keywords,
    70, H * L.text_top,
    W - 140, 64, 44
  );

  // ── FIX #3: diagram card — tight, no dead zone ────────────────────────────
  const cardX = 48;
  const cardY = H * L.card_top;
  const cardW = W - 96;
  const cardH = H * (L.card_bottom - L.card_top);

  ctx.save();
  ctx.fillStyle = C.card_bg;
  ctx.strokeStyle = C.card_bd;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 22);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  if (diagramImage) {
    const scaleF = Math.min((cardW - 40) / diagramImage.width, (cardH - 40) / diagramImage.height);
    const dw = diagramImage.width * scaleF;
    const dh = diagramImage.height * scaleF;
    ctx.drawImage(diagramImage, cardX + (cardW - dw) / 2, cardY + (cardH - dh) / 2, dw, dh);
  } else {
    // Diagram title
    ctx.font = f(30, true);
    ctx.fillStyle = C.blue;
    ctx.textAlign = 'center';
    ctx.fillText(diagram?.title || 'Architecture', W / 2, cardY + 52);
    // Placeholder flow
    drawPlaceholderFlow(ctx, cardX + 10, cardY + 60, cardW - 20, cardH - 70, content);
  }

  drawWatermark(ctx);
  return canvas.toBuffer('image/png');
}


// ══════════════════════════════════════════════════════════════════════════════
// OUTRO FRAME
// ══════════════════════════════════════════════════════════════════════════════
function drawOutroFrame(frameNum = 0) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const cx = W / 2;

  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  drawCornerAccents(ctx);

  ctx.font = f(90, true);
  ctx.fillStyle = C.text;
  ctx.textAlign = 'center';
  ctx.fillText('Thanks For', cx, H / 2 - 150);
  ctx.fillText('Watching! 🙏', cx, H / 2 - 40);

  // Bouncing subscribe button
  const bounce = Math.abs(Math.sin(frameNum / FPS * Math.PI * 2.8)) * 24;
  const pillW = 580, pillH = 92;
  const pillX = cx - pillW / 2;
  const pillY = H / 2 + 100 - bounce;

  ctx.save();
  ctx.fillStyle = C.red;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 46);
  ctx.fill();
  ctx.font = f(48, true);
  ctx.fillStyle = '#FFF';
  ctx.fillText('🔔  SUBSCRIBE', cx, pillY + 62);
  ctx.restore();

  ctx.font = f(72);
  ctx.fillStyle = C.text;
  ctx.fillText('👍    💬    ↗️', cx, H / 2 + 300);

  drawWatermark(ctx);
  return canvas.toBuffer('image/png');
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER (REMOTION BASED)
// ══════════════════════════════════════════════════════════════════════════════
async function assembleVideoRemotion(content, diagrams, metadata, questionNum, config = {}) {
  const domainSlug = (content.domain || 'GCP').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
  const topicSlug = (content.topic || 'video').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
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

  // ── Encode SFX files ──
  const sfxDir = path.join(__dirname, '..', 'sample_audio_files', 'sfx');
  const sfx = {
    whoosh: encodeFileAsDataUri(path.join(sfxDir, 'whoosh.wav'), 'audio/wav'),
    pop: encodeFileAsDataUri(path.join(sfxDir, 'pop.mp3'), 'audio/mp3'),
  };
  if (sfx.whoosh) console.log('  💨 SFX loaded: whoosh.wav');
  if (sfx.pop) console.log('  🔵 SFX loaded: pop.mp3');

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
          } finally {
            // Keep the thumb props file so `test-thumbnail.js` can be run anytime
            // try { fs.unlinkSync(thumbPropsFile); } catch (e) { }
          }
        }
        resolve();
      } else {
        reject(new Error(`Remotion render exited with code ${code}`));
      }
    });
  });

  // Keep the props file for debugging / Remotion Studio
  // try { fs.unlinkSync(propsFile); } catch (e) { }
  return { videoPath: finalOutputPath, thumbnailPath };
}


// ══════════════════════════════════════════════════════════════════════════════
// MAIN ASSEMBLER (NATIVE CANVAS)
// ══════════════════════════════════════════════════════════════════════════════
async function assembleVideoCanvas(content, diagrams, audioPath, questionNum) {
  const frameDir = path.join(DIRS.frames, `q${questionNum}`);
  fs.mkdirSync(frameDir, { recursive: true });

  const diagImages = {};
  for (const d of diagrams || []) {
    if (d.png_path && fs.existsSync(d.png_path)) {
      try { diagImages[d.id] = await loadImage(d.png_path); } catch (e) { }
    }
  }

  let n = 0;
  const save = (buf) => { fs.writeFileSync(path.join(frameDir, `frame_${String(n).padStart(5, '0')}.png`), buf); n++; };

  for (let i = 0; i < INTRO_FRAMES; i++) save(drawIntroFrame(content));
  const sections = content.answer_sections || [];
  for (let s = 0; s < sections.length; s++) {
    const sec = sections[s];
    const diag = (diagrams || []).find(d => d.section_id === sec.id);
    for (let i = 0; i < SECTION_FRAMES; i++) save(drawContentFrame(sec, diag, i / SECTION_FRAMES, content, diagImages[diag?.id]));
  }
  for (let i = 0; i < OUTRO_FRAMES; i++) save(drawOutroFrame(i));

  const domainSlug = (content.domain || 'GCP').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
  const topicSlug = (content.topic || 'video').replace(/[\s/]+/g, '_').replace(/[^\w-]/g, '');
  const slug = `${domainSlug}_${topicSlug}`;
  const out = path.join(DIRS.video, `q${questionNum}_${slug}.mp4`);

  execSync(`/opt/homebrew/bin/ffmpeg -y -framerate ${FPS} -i "${frameDir}/frame_%05d.png" -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p "${out}"`, { stdio: 'inherit' });
  return { videoPath: out, thumbnailPath: null };
}

// Global dispatcher
async function assembleVideo(content, diagrams, metadata, questionNum, useRemotion = false, config = {}) {
  if (useRemotion) {
    return assembleVideoRemotion(content, diagrams, metadata, questionNum, config);
  } else {
    return assembleVideoCanvas(content, diagrams, null, questionNum);
  }
}

module.exports = { assembleVideo, drawIntroFrame, drawContentFrame, drawOutroFrame };
