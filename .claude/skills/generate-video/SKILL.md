---
name: generate-video
description: Generate an educational video from a topic and domain. Handles the full flow — research, content JSON, metadata JSON, render, and optional posting.
---

# /generate-video

Generate an educational short-form video for any cloud/tech domain.

## Usage

```
/generate-video <topic> --number <N> --domain <domain> [--voice] [--post]
```

Examples:
```
/generate-video "Cloud Run vs GKE" --number 42 --domain GCP
/generate-video "Lambda cold starts" --number 100 --domain AWS --voice
/generate-video "Pod autoscaling" --number 200 --domain Kubernetes --voice --post
```

## Steps

### 1. Research the Topic

Use web search to find the latest information about the topic:
- Current service names, API versions, pricing
- Any recent deprecations or new features
- Best practices and common architecture patterns

### 2. Generate Content JSON

Write `output_prod/q{N}_content.json` following the schema in CLAUDE.md.

Key constraints:
- **2-3 answer sections**
- **`text`**: 15-20 words per section, 3-5 short lines
- **`spoken_audio`**: 10-20 words per section
- **Keywords**: exact words from `text`
- **Diagram `dsl`**: stringified JSON with nodes/edges
- **Node labels**: 1-2 words MAX
- **Direction**: LR for <=3 nodes, TB for >3

### 3. Self-Review

Before proceeding, count words in each `spoken_audio` and `text` field. Verify all constraints. Fix any issues.

### 4. Generate Metadata JSON

Write `output_prod/q{N}_metadata.json` with YouTube, Instagram, TikTok metadata.

### 5. Design the Video

Generate `output_prod/q{N}_design.json` — make fresh visual design decisions for THIS specific video. Use `/design-video` skill or follow the design JSON schema in CLAUDE.md.

You decide:
- **Color palette** based on domain + topic mood (e.g., AWS Lambda = orange primary + purple serverless accent)
- **Animation types** for intro, text reveal, diagram entrance, transitions, outro
- **Diagram node style** (bordered, filled, glass, gradient, neon)
- **Background effects** (radial-glow, mesh-gradient, none)
- **Typography** sizes and weights
- **Custom SVG assets** if the topic benefits from them

Every video should look unique. Don't reuse the same design decisions — adapt to the content.

### 6. Render

```bash
node scripts/render.js --number {N} --platform youtube --platform meta
```

Add `--voice` if voice was requested:
```bash
node scripts/render.js --number {N} --platform youtube --platform meta --voice
```

### 7. Track in Database

```bash
node scripts/track.js --number {N} --domain "{domain}" --topic "{topic}"
```

### 8. Post (if --post flag)

```bash
node scripts/post.js --number {N} --platforms youtube,meta
```
