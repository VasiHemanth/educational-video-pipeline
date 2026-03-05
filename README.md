# GCP Video Pipeline 🎬

Automated pipeline that generates **AI Cloud Architect** educational shorts — topic → LLM script → Remotion diagrams → video → auto-post to YouTube/Instagram/Facebook.

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env with your API keys

# Generate a video (test environment)
npm run video -- --topic "Cloud Run vs GKE" --number 14 --env test --dry-run

# Generate a video (production)
npm run video -- --topic "Cloud Run vs GKE" --number 14 --env prod

# Generate a carousel
npm run carousel -- --type insight --topic "AI Agents" --dry-run
```

---

## npm Scripts

| Command | Description |
|---------|-------------|
| `npm run video -- [flags]` | Generate a video via the main pipeline |
| `npm run carousel -- [flags]` | Generate a carousel (insight or technical) |
| `npm run upload -- --number <N>` | Upload a previously-rendered video |
| `npm run thumbnail <N>` | Regenerate thumbnail for question N |
| `npm run token:check` | Check Meta API token status |
| `npm run token:refresh` | Exchange short-lived Meta token for 60-day token |

---

## Environment Modes

The pipeline supports two environments via `--env` flag or `PIPELINE_ENV` env var:

| Mode | Database | Output Dir | Use Case |
|------|----------|-----------|----------|
| `test` | `content_tracker.sqlite` | `output/` | Development & testing |
| `prod`  (default) | `prod_tracker.sqlite` | `output_prod/` | Production content |

```bash
# Test mode
npm run video -- --topic "Test Topic" --number 999 --env test --dry-run

# Production mode (default)
npm run video -- --topic "Cloud Armor" --number 20
```

---

## LLM Providers

Switch providers via `LLM_PROVIDER` in `.env` — zero code changes:

| Provider | Setup | Cost |
|----------|-------|------|
| `gemini` (default) | `npm i -g @google/gemini-cli && gemini auth login` | Free |
| `ollama` | [ollama.ai](https://ollama.ai) + `ollama pull llama3.1` | Free (local) |
| `claude` | `npm i -g @anthropic-ai/claude-code && claude auth` | Claude Pro/Max |
| `anthropic` | API key at console.anthropic.com | Pay-per-token |

```bash
# Override on the fly
LLM_PROVIDER=ollama npm run video -- --topic "Cloud Spanner" --number 18
```

---

## Pipeline Architecture

```
Topic + Number + --env
     │
     ▼
┌─────────────┐
│  LLM Layer  │  ← provider-agnostic (gemini/ollama/claude/anthropic)
└─────────────┘
     │ JSON: { question, sections, diagrams[], voiceover_script }
     ▼
┌─────────────────────┐
│  Voice TTS (Qwen3)  │  ← local MLX-based TTS
└─────────────────────┘
     │ WAV audio segments
     ▼
┌─────────────────────┐
│  Remotion Renderer  │  ← React components → MP4
│  + Native Diagrams  │
└─────────────────────┘
     │ MP4 + Thumbnails
     ▼
┌─────────────────────────────┐
│  Platform APIs              │
│  YouTube · Instagram · FB   │
└─────────────────────────────┘
```

---

## CLI Flags Reference (Video Pipeline)

| Flag | Description | Default |
|------|-------------|---------|
| `--topic <str>` | Subject matter for the LLM | Required |
| `--number <int>` | Question sequence number | Required |
| `--domain <str>` | Technology domain (e.g. `GCP`, `Generative AI`) | `GCP` |
| `--env <str>` | Environment: `test` or `prod` | `prod` |
| `--skip-llm` | Skip Gemini call, use existing `qX_content.json` | off |
| `--diagrams <str>` | `remotion` (native), `mermaid`, or `excalidraw` | `remotion` |
| `--anim <str>` | `highlight` (word-by-word) or `type` (typewriter) | `highlight` |
| `--hook` | Generate a viral hook for the intro card | off |
| `--no-voice` | Skip Qwen3 TTS voice generation | voice on |
| `--voice-preset <str>` | TTS voice preset | `happy_mentor_male` |
| `--platforms <str>` | Comma-separated: `youtube`, `meta` | `youtube` |
| `--post` | Auto-upload to social platforms after render | off |
| `--dry-run` | Generate JSON only, skip render | off |
| `--provider <str>` | Override LLM provider for this run | from `.env` |

---

## CLI Flags Reference (Carousel Pipeline)

| Flag | Description | Default |
|------|-------------|---------|
| `--type <str>` | `insight` (from URL/topic) or `technical` (from existing JSON) | `insight` |
| `--url <str>` | Blog URL to distill (insight type) | — |
| `--topic <str>` | Topic for LLM generation (insight type) | — |
| `--number <int>` | Question # (technical type) | — |
| `--id <str>` | Carousel ID for output folder | auto-generated |
| `--domain <str>` | Technology domain | `AI` |
| `--post` | Auto-post to Instagram/Facebook | off |
| `--dry-run` | Generate slides JSON only | off |

---

## Output Structure

```
output_prod/          (or output/ in test mode)
  q14_content.json     ← LLM-generated content + diagram specs
  q14_metadata.json    ← YouTube/Instagram metadata
  diagrams/
    q14_diagram_1.png
  video/
    q14_GCP_Cloud_Run_vs_GKE_youtube.mp4
    q14_GCP_Cloud_Run_vs_GKE_meta.mp4
  thumbnails/
    q14_GCP_Cloud_Run_vs_GKE_thumbnail.png
  carousels/
    carousel_1234/
      slides.json
      slide_01.png ... slide_10.png
```

---

## Project Structure

```
├── pipeline.js           # Main video generation pipeline
├── carousel_pipeline.js  # Carousel generation pipeline
├── upload.js             # Standalone upload utility
├── generate-thumbnail.js # Standalone thumbnail regenerator
├── providers/
│   └── llm.js            # Provider-agnostic LLM wrapper
├── prompts/
│   ├── index.js          # Video pipeline prompts
│   └── carousel.js       # Carousel pipeline prompts
├── scripts/
│   ├── assembler.js      # Remotion video assembler
│   ├── db.js             # SQLite tracking (dual-DB)
│   ├── post.js           # Social media upload (YouTube/FB/IG)
│   ├── diagrams.js       # Diagram rendering (Excalidraw/Mermaid)
│   ├── carousel_renderer.js  # Puppeteer carousel slide renderer
│   ├── carousel_post.js  # Carousel social posting
│   ├── meta_token.js     # Meta API token utility
│   └── generate_voice.py # Qwen3 TTS voice generation
├── utils/
│   ├── env.js            # Environment config (test vs prod)
│   └── cli.js            # Shared CLI arg parser
├── remotion/             # Remotion React components
├── templates/            # HTML templates (carousel slides)
└── assets/               # Static assets
```

---

## Environment Variables (`.env`)

```bash
# LLM
LLM_PROVIDER=gemini
GEMINI_MODEL=gemini-3-flash

# YouTube
YOUTUBE_CLIENT_SECRET_FILE='./client_secret.json'

# Meta Platforms
META_APP_ID=...
META_APP_SECRET=...
FB_PAGE_ID=...
IG_ACCOUNT_ID=...
META_ACCESS_TOKEN=...

# Cloudinary (for Instagram uploads)
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```
