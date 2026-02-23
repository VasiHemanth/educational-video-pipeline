# GCP Video Pipeline 🎬

Automated pipeline that generates **GCP Daily Interview Questions** shorts — question → script → diagrams → video → post.

## Provider Roadmap

```
PHASE 1 (now)    →  Gemini CLI      (free, fast to set up)
PHASE 2 (next)   →  Ollama local    (free, private, offline)
PHASE 3 (prod)   →  Claude Code     (best quality, integrated)
PHASE 4 (scale)  →  Anthropic API   (pay-per-token, 24/7 batch)
```

Switching providers = **one line in `.env`**. Zero code changes.

---

## Setup

### 1. Install dependencies

```bash
npm install
cp .env.example .env
```

### 2. Install CLI tools

```bash
# Excalidraw flowchart renderer (already works via npx, no install needed)
npx @swiftlysingh/excalidraw-cli --version

# FFmpeg (for video encoding)
# Ubuntu/Debian:
sudo apt install ffmpeg
# macOS:
brew install ffmpeg

# Canvas dependencies (for assembler.js on macOS):
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Optional: Puppeteer for high-quality diagram PNG export
npm install puppeteer
```

---

## Phase 1 — Gemini CLI (FREE, start here)

```bash
# 1. Install Gemini CLI
npm install -g @google/gemini-cli

# 2. Login with your Google account (free)
gemini auth login

# 3. Set provider in .env
echo "LLM_PROVIDER=gemini" >> .env

# 4. Generate your first video (dry run — content only, no render)
node pipeline.js --topic "Cloud Run vs GKE" --number 14 --dry-run

# 5. Full render
node pipeline.js --topic "Cloud Run vs GKE" --number 14
```

**Free tier limits:** 60 requests/min on gemini-2.0-flash-exp. More than enough.

---

## Phase 2 — Ollama (local, free, private)

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull a model (llama3.1 is best balance of quality/speed)
ollama pull llama3.1
# Or for better JSON quality:
ollama pull mistral

# 3. Switch provider
echo "LLM_PROVIDER=ollama" > .env
echo "OLLAMA_MODEL=llama3.1" >> .env

# 4. Run same command — zero other changes
node pipeline.js --topic "BigQuery partitioning strategies" --number 15
```

**Tip:** Ollama + llama3.1 works offline, no API key, no rate limits.

---

## Phase 3 — Claude Code CLI

```bash
# 1. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Auth (needs Claude Pro/Max)
claude auth

# 3. Switch provider
echo "LLM_PROVIDER=claude" > .env

# 4. Run
node pipeline.js --topic "GKE Autopilot vs Standard" --number 16
```

**Why upgrade:** Claude produces more structured JSON, better DSL diagrams, more accurate GCP content.

---

## Phase 4 — Anthropic API (production/batch)

```bash
# 1. Get API key at console.anthropic.com
# 2. Set in .env:
echo "LLM_PROVIDER=anthropic" >> .env
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env

# 3. Batch generate 10 videos:
for i in 14 15 16 17 18 19 20 21 22 23; do
  node pipeline.js --number $i --topic "$(node scripts/topic_picker.js $i)"
done
```

---

## Pipeline Architecture

```
Topic + Number
     │
     ▼
┌─────────────┐
│  LLM Layer  │  ← provider-agnostic (gemini/ollama/claude/anthropic)
└─────────────┘
     │ JSON: { question, sections, diagrams[], voiceover_script }
     ▼
┌─────────────────────┐
│  Excalidraw CLI     │  ← DSL → .excalidraw → PNG
│  (excalidraw-chart) │
└─────────────────────┘
     │ diagram PNGs
     ▼
┌─────────────┐
│  Assembler  │  ← canvas frames + diagrams + (TTS audio)
│  + FFmpeg   │
└─────────────┘
     │ MP4
     ▼
┌─────────────────────────────┐
│  Platform APIs (Phase 3+)   │
│  YouTube · Instagram · TikTok│
└─────────────────────────────┘
```

---

## Quick Command Reference

```bash
# Generate content only (no render, instant)
node pipeline.js --topic "Pub/Sub vs Kafka" --number 17 --dry-run

# Full video with Gemini
node pipeline.js --topic "Pub/Sub vs Kafka" --number 17

# Switch to Ollama on the fly
LLM_PROVIDER=ollama node pipeline.js --topic "Cloud Spanner" --number 18

# Switch to Claude Code on the fly  
LLM_PROVIDER=claude node pipeline.js --topic "Cloud Armor WAF" --number 19
```

---

## Output Structure

```
output/
  q14_content.json          ← full LLM-generated content + diagram DSL
  q14_metadata.json         ← YouTube/Instagram/TikTok metadata
  diagrams/
    q14_diagram_1.excalidraw
    q14_diagram_1.png
    q14_diagram_2.png
  frames/
    q14/frame_00001.png ... 
  video/
    q14_Cloud_Run_vs_GKE.mp4 ← final deliverable
```

---

## Adding TTS (Phase 2)

Uncomment in `pipeline.js`:

```js
// Google Cloud TTS (free 1M chars/month)
const tts = require('./scripts/tts_google');
const audioPath = await tts.synthesize(contentJson.voiceover_script, NUMBER);

// OR ElevenLabs (best voice quality)
const tts = require('./scripts/tts_elevenlabs');
const audioPath = await tts.synthesize(contentJson.voiceover_script, NUMBER);
```

---

## GCP Topic List (seed)

| # | Topic |
|---|-------|
| 14 | Cloud Run vs GKE |
| 15 | BigQuery partitioning strategies |
| 16 | GKE Autopilot vs Standard |
| 17 | Pub/Sub vs Kafka on GCP |
| 18 | Cloud Spanner global consistency |
| 19 | Cloud Armor WAF policies |
| 20 | Vertex AI vs AutoML |
| 21 | Cloud SQL HA and failover |
| 22 | VPC peering vs Shared VPC |
| 23 | Cloud Functions vs Cloud Run |
