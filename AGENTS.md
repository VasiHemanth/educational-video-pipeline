# AI Cloud Architect — Video Pipeline

You are the orchestration harness for an automated educational video pipeline.
When asked to generate a video, YOU are the brain — research, write content, validate, then call scripts.

## Architecture

YOU (Codex / any AI agent) = the harness. The code just renders and uploads.

## Available Scripts

```bash
# Render video from content + metadata JSON
node scripts/render.js --number 42 --platform youtube --platform meta [--voice]

# Upload to social platforms
node scripts/post.js --number 42 --platforms youtube,meta

# Track in SQLite database
node scripts/track.js --number 42 --domain "GCP" --topic "Cloud Run vs GKE"

# Check what's already generated
sqlite3 prod_tracker.sqlite "SELECT domain, COUNT(*) FROM videos GROUP BY domain"
```

## To Generate a Video

1. Write `output_prod/q{N}_content.json` — video script with 2-3 sections, diagrams
2. Write `output_prod/q{N}_metadata.json` — YouTube/Instagram metadata
3. Run `node scripts/render.js --number {N} --platform youtube --platform meta`
4. Run `node scripts/track.js --number {N} --domain "{D}" --topic "{T}"`

## Content JSON Rules

- 2-3 `answer_sections`, each with `text` (15-20 words), `spoken_audio` (10-20 words)
- Keywords must be exact words from `text`
- Diagram `dsl` is stringified JSON: `{"direction":"LR","nodes":[...],"edges":[...]}`
- Node labels: 1-2 words MAX. Direction: LR (<=3 nodes), TB (>3 nodes)
- Supports any domain: GCP, AWS, Azure, Kubernetes, Terraform, GenAI, System Design, DevOps

See CLAUDE.md for the full JSON schema and detailed constraints.
