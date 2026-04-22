# AI Cloud Architect — Video Pipeline

You are the orchestration harness for an automated educational video pipeline.
When the user asks you to generate a video, YOU are the brain — research, write content, validate, then call scripts to render and post.

## Architecture

```
YOU (Gemini CLI) = the harness
  |
  |-- Research topic (use your web search / extensions)
  |-- Generate content JSON (you write it directly to file)
  |-- Generate metadata JSON (you write it directly to file)
  |-- Call: node scripts/render.js --number N [--voice] [--platform youtube,meta]
  |-- Call: node scripts/post.js --number N [--platforms youtube,meta]
  |-- Call: node scripts/track.js --number N --domain X --topic "Y"
```

**The code does NOT call LLMs.** YOU are the LLM. You generate the JSON, validate it, self-correct.

## Quick Commands

| Task | Command |
|------|---------|
| Render video | `node scripts/render.js --number 42 --platform youtube --platform meta` |
| Render with voice | `node scripts/render.js --number 42 --platform youtube --voice` |
| Post video | `node scripts/post.js --number 42 --platforms youtube,meta` |
| Track in DB | `node scripts/track.js --number 42 --domain GCP --topic "Cloud Run"` |
| Re-upload | `node upload.js --number 42` |
| Check DB coverage | `sqlite3 prod_tracker.sqlite "SELECT domain, COUNT(*) FROM videos GROUP BY domain"` |
| List topics | `sqlite3 prod_tracker.sqlite "SELECT question_number, topic FROM videos WHERE domain='GCP' ORDER BY question_number"` |

## Content JSON Schema

Write to `output_prod/q{N}_content.json`:

```json
{
  "question_number": 42,
  "topic": "Cloud Run vs GKE",
  "domain": "GCP",
  "question_text": "How would you choose between Cloud Run and GKE?",
  "hook_text": "Here's the one question that separates junior from senior cloud architects",
  "cta_text": "Save this for your next architecture review",
  "title_card_text": "Run vs GKE Showdown",
  "tech_terms": ["Cloud Run", "GKE", "Kubernetes"],
  "hashtags": ["#GCP", "#CloudArchitect"],
  "answer_sections": [
    {
      "id": 1,
      "title": "WHEN TO USE CLOUD RUN",
      "text": "Stateless HTTP containers\nAuto-scales to zero\nNo cluster management\nPay per request only",
      "spoken_audio": "Cloud Run is your go-to for stateless HTTP workloads that need auto-scaling.",
      "keywords": {
        "tech_terms": ["Cloud Run", "HTTP"],
        "action_verbs": ["scales"],
        "concepts": ["stateless"]
      }
    }
  ],
  "diagrams": [
    {
      "id": 1, "section_id": 1, "title": "Architecture",
      "type": "flowchart", "direction": "LR",
      "dsl": "{\"direction\":\"LR\",\"nodes\":[{\"id\":\"a\",\"label\":\"Request\",\"type\":\"user\"},{\"id\":\"b\",\"label\":\"Cloud Run\",\"type\":\"compute\"}],\"edges\":[{\"from\":\"a\",\"to\":\"b\"}]}"
    }
  ]
}
```

### Rules
- 2-3 answer sections
- `text`: 15-20 words, 3-5 lines
- `spoken_audio`: 10-20 words
- Keywords: exact words from `text`
- Diagram `dsl`: stringified JSON with nodes/edges
- Node labels: 1-2 words MAX
- Direction: LR (<=3 nodes), TB (>3 nodes)

## Metadata JSON Schema

Write to `output_prod/q{N}_metadata.json`:

```json
{
  "youtube": { "title": "...", "description": "...", "tags": ["20 tags"], "category": "Education" },
  "thumbnail": { "headline": "5 WORDS MAX", "subheadline": "10-12 words" },
  "instagram": { "caption": "hook + bullets + CTA + hashtags", "cover_text": "3 WORDS" },
  "tiktok": { "caption": "150 chars max" }
}
```

## Supported Domains

GCP, AWS, Azure, Kubernetes, Terraform, Generative AI, System Design, DevOps — or any tech domain.

## Mobile Rendering Constraints

Canvas: 1080x1920 (9:16). Top 200px clear. Diagram zone: 36%-92%. Node labels: 1-2 words MAX.

## Workflow

1. Research topic (web search for latest info)
2. Write `output_prod/q{N}_content.json`
3. Write `output_prod/q{N}_metadata.json`
4. Self-review: count words, validate JSON, check constraints
5. `node scripts/render.js --number {N} --platform youtube --platform meta`
6. `node scripts/track.js --number {N} --domain "{D}" --topic "{T}"`
7. (Optional) `node scripts/post.js --number {N} --platforms youtube,meta`
