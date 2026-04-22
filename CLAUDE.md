# AI Cloud Architect — Video Pipeline

You are the orchestration harness for an automated educational video pipeline.
When the user asks you to generate a video, YOU are the brain — research, write content, validate, then call scripts to render and post.

## Architecture

```
YOU (Claude Code / Gemini / Codex) = the harness
  |
  |-- Research topic (web search, read domain files)
  |-- Generate content JSON (you write it directly)
  |-- Generate metadata JSON (you write it directly)
  |-- Generate design JSON (you make ALL visual decisions)
  |-- Call: node scripts/render.js --number N [--voice] [--platform youtube,meta]
  |-- Call: node scripts/post.js --number N [--platforms youtube,meta]
  |-- Call: node scripts/track.js --number N --domain X --topic "Y"
```

**The code does NOT call LLMs.** YOU are the LLM. You generate ALL three JSONs (content, metadata, design), you validate them, you self-correct. Every video gets a unique visual identity because YOU make fresh design decisions each time.

## Quick Reference — Available Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `node scripts/research.js` | Coverage gaps + topic brief | `--domain GCP --suggest 8` |
| `node scripts/render.js` | Remotion video render | `--number 42 --voice --platform youtube` |
| `node scripts/post.js` | Upload to social platforms | `--number 42 --platforms youtube,meta` |
| `node scripts/track.js` | Track in SQLite DB | `--number 42 --domain GCP --topic "Cloud Run"` |
| `node scripts/generate_voice.py` | Qwen3 TTS voice gen | Called by render.js when --voice flag set |
| `node upload.js` | Re-upload existing video | `--number 42` |
| `node generate-thumbnail.js` | Regenerate thumbnail | `42` |

## Content JSON Schema

When generating video content, write to `output_prod/q{N}_content.json`:

```json
{
  "question_number": 42,
  "topic": "Cloud Run vs GKE",
  "domain": "GCP",
  "question_text": "How would you choose between Cloud Run and GKE for a microservices deployment?",
  "hook_text": "Here's the one question that separates junior from senior cloud architects",
  "cta_text": "Save this for your next architecture review",
  "title_card_text": "Run vs GKE Showdown",
  "tech_terms": ["Cloud Run", "GKE", "Kubernetes", "autoscaling"],
  "hashtags": ["#GCP", "#CloudArchitect", "#Kubernetes"],
  "answer_sections": [
    {
      "id": 1,
      "title": "WHEN TO USE CLOUD RUN",
      "text": "Stateless HTTP containers\nAuto-scales to zero\nNo cluster management\nPay per request only",
      "spoken_audio": "Cloud Run is your go-to for stateless HTTP workloads that need zero-to-hero autoscaling.",
      "keywords": {
        "tech_terms": ["Cloud Run", "HTTP"],
        "action_verbs": ["scales"],
        "concepts": ["stateless", "autoscaling"]
      }
    }
  ],
  "diagrams": [
    {
      "id": 1,
      "section_id": 1,
      "title": "Cloud Run Architecture",
      "type": "flowchart",
      "dsl": "{\"direction\":\"LR\",\"nodes\":[{\"id\":\"a\",\"label\":\"Request\",\"type\":\"user\"},{\"id\":\"b\",\"label\":\"Cloud Run\",\"type\":\"compute\"},{\"id\":\"c\",\"label\":\"Cloud SQL\",\"type\":\"database\"}],\"edges\":[{\"from\":\"a\",\"to\":\"b\"},{\"from\":\"b\",\"to\":\"c\"}]}",
      "direction": "LR"
    }
  ]
}
```

### Content Rules
- **2-3 answer sections** per video
- **`text`**: 15-20 words total, spread across 3-5 short lines (newline separated)
- **`spoken_audio`**: 10-20 words for TTS narration
- **Keywords**: must be exact words from the `text` field
- **Diagram DSL**: stringified JSON with nodes/edges (see Diagram Schema below)
- **Node labels**: 1-2 words MAX (must be readable on phone)
- **Diagram direction**: LR for <=3 nodes, TB for >3 nodes

### Diagram DSL Schema (inside `dsl` field as stringified JSON)
```json
{
  "direction": "LR | TB",
  "nodes": [
    { "id": "string", "label": "1-2 words", "type": "compute|storage|database|messaging|user", "iconName": "service-name" }
  ],
  "edges": [
    { "from": "node_id", "to": "node_id", "label": "optional" }
  ]
}
```

## Metadata JSON Schema

Write to `output_prod/q{N}_metadata.json`:

```json
{
  "youtube": {
    "title": "GCP Interview Q42: Cloud Run vs GKE #Shorts",
    "description": "Technical description...",
    "tags": ["GCP", "CloudRun", "GKE", "...20 tags total"],
    "category": "Education",
    "playlist": "GCP Daily Interview Questions"
  },
  "thumbnail": {
    "headline": "RUN VS GKE",
    "subheadline": "The decision that defines your architecture"
  },
  "instagram": {
    "caption": "Hook line...\n\n► Point 1\n► Point 2\n► Point 3\n► Point 4\n\nSave this | Comment below\n\n#hashtags",
    "cover_text": "RUN VS GKE",
    "first_comment_hashtags": "8 additional hashtags"
  },
  "tiktok": {
    "caption": "Hook + value + CTA (max 150 chars)"
  }
}
```

## Design JSON Schema

Write to `output_prod/q{N}_design.json`. **YOU decide every visual property.** No templates — make fresh creative decisions per video based on domain, topic mood, and content density.

```json
{
  "palette": {
    "background": "#0A0A0A",
    "surface": "#1C1C1E",
    "primary": "#FF9900",
    "secondary": "#232F3E",
    "accent": "#2997FF",
    "text": "#F5F5F7",
    "textMuted": "#86868B",
    "gradients": {
      "introGlow": ["#FF990020", "#2997FF15"],
      "sectionAccents": ["#FF9900", "#2997FF", "#32D74B"],
      "cta": ["#FF9900", "#FF6B00"]
    }
  },
  "typography": {
    "fontFamily": "'Inter', '-apple-system', sans-serif",
    "hookSize": 64,
    "titleSize": 40,
    "bodySize": 38,
    "labelSize": 20,
    "titleWeight": 900,
    "bodyWeight": 400,
    "keywordWeight": 700
  },
  "animations": {
    "intro": {
      "type": "stagger-chars | slide-up | scale-in | typewriter | blur-in",
      "spring": { "damping": 80, "stiffness": 100 },
      "staggerDelay": 2
    },
    "textReveal": {
      "type": "line-by-line | word-by-word | highlight-sweep | fade-lines",
      "staggerDelay": 8
    },
    "diagramEntrance": {
      "type": "pop-in | cascade | draw-edges | fade-cascade",
      "nodeDelay": 15,
      "spring": { "damping": 14, "stiffness": 170 }
    },
    "transition": {
      "type": "cut | crossfade | slide-left | wipe-down",
      "durationFrames": 8
    },
    "outro": {
      "type": "pulse-cta | expand-rings | zoom-reveal",
      "spring": { "damping": 12, "stiffness": 80 }
    }
  },
  "effects": {
    "backgroundType": "radial-glow | mesh-gradient | none",
    "glowColors": ["#FF990020", "#2997FF15"],
    "glowIntensity": 0.7,
    "glowBlur": 100,
    "vignette": false,
    "noise": false,
    "scanlines": false
  },
  "diagrams": {
    "nodeStyle": "bordered | filled | glass | gradient | neon",
    "edgeStyle": "solid | dashed | glow",
    "edgeColor": "#48484A",
    "nodeShapes": {
      "compute": "rounded-rect",
      "database": "pill",
      "storage": "pill",
      "messaging": "rounded-rect",
      "user": "rounded-rect"
    },
    "glowOnActive": true,
    "iconDomain": "aws | gcp | azure | kubernetes"
  },
  "layout": {
    "introTextTop": "20%",
    "sectionTitleTop": 200,
    "sectionTextTop": 320,
    "diagramTop": "36%",
    "diagramBottom": "8%",
    "progressBar": true,
    "progressBarStyle": "glow | solid | none",
    "bulletStyle": "arrow | dash | dot | number"
  },
  "svgAssets": [
    {
      "id": "asset_id",
      "svg": "<svg>...</svg>",
      "placement": "background | overlay",
      "opacity": 0.1
    }
  ]
}
```

### Design Decision Guide

| Domain | Primary | Secondary | Adapt by topic |
|--------|---------|-----------|---------------|
| AWS | `#FF9900` | `#232F3E` | Security +red, Serverless +purple, Data +teal |
| GCP | `#4285F4` | `#EA4335` | ML/AI +violet, Network +green, Storage +amber |
| Azure | `#0078D4` | `#50E6FF` | DevOps +orange, Security +red, Data +green |
| Kubernetes | `#326CE5` | `#FFFFFF` | Networking +teal, Security +red, Scaling +green |
| Terraform | `#7B42BC` | `#FFFFFF` | Multi-cloud +rainbow, State +amber, Modules +green |
| GenAI | `#FF6F61` | `#6C5CE7` | RAG +blue, Agents +purple, Training +green |
| System Design | `#2997FF` | `#BF5AF2` | Caching +amber, Scaling +green, Queues +purple |
| DevOps | `#F4811F` | `#32D74B` | CI/CD +green, Security +red, Monitoring +blue |

## Supported Domains

This pipeline supports ANY cloud/tech domain. Use `--domain` flag or specify in conversation:

| Domain | Focus Areas |
|--------|------------|
| **GCP** | Compute Engine, Cloud Run, GKE, BigQuery, Dataflow, Vertex AI, Pub/Sub, Cloud Storage |
| **AWS** | EC2, Lambda, ECS/EKS, S3, RDS, DynamoDB, SageMaker, SNS/SQS, Kinesis |
| **Azure** | VMs, Functions, AKS, Blob Storage, Cosmos DB, Azure ML, Service Bus |
| **Kubernetes** | Pods, Deployments, Services, Ingress, Operators, Helm, Service Mesh |
| **Terraform** | Providers, Modules, State, Workspaces, HCL patterns, CI/CD |
| **Generative AI** | RAG, Fine-tuning, Agents, Vector DBs, Prompt Engineering, LLM Ops |
| **System Design** | Load balancing, Caching, Sharding, Event-driven, CQRS, Microservices |
| **DevOps** | CI/CD, Observability, SRE, GitOps, Container Security, IaC |

When generating content for a domain:
1. Read the domain reference file: `domains/{domain-slug}.md` (e.g., `domains/gcp.md`, `domains/aws.md`)
2. Use real service names, real CLI commands, and real architecture patterns from the reference
3. Web search for the latest information if needed
4. Use icon names from the domain file for diagram nodes

## Mobile-First Rendering Constraints

Canvas: 1080x1920 (9:16 portrait) for YouTube Shorts / Instagram Reels / Facebook Reels.

- **Top 200px**: CLEAR (platform chrome)
- **Text zone**: 200-600px
- **Diagram zone**: 36%-92% of height (~1075px usable)
- **Watermark**: bottom-left only (right side has like/share buttons)
- **Node labels**: 1-2 words MAX (readable on 6-inch phone)

## Environment

- **Production output**: `output_prod/` (default)
- **Test output**: `output/` (use `--env test`)
- **Production DB**: `prod_tracker.sqlite`
- **Test DB**: `content_tracker.sqlite`
- **Voice output**: `voice_output/`
- **Remotion project**: `remotion/`

## Workflow: Generate a Video

1. **Research**: Web search for latest info on the topic. Check what's current.
2. **Write content JSON**: Generate `output_prod/q{N}_content.json` following the schema above.
3. **Write metadata JSON**: Generate `output_prod/q{N}_metadata.json`.
4. **Design the video**: Generate `output_prod/q{N}_design.json` — make ALL visual decisions fresh for this video (palette, animations, diagram style, effects, typography). Use `/design-video` skill.
5. **Render**: `node scripts/render.js --number {N} --platform youtube --voice`
6. **Review**: Check if render succeeded. If errors, read the error, fix JSON, retry.
7. **Post** (if requested): `node scripts/post.js --number {N} --platforms youtube,meta`
8. **Track**: `node scripts/track.js --number {N} --domain "{D}" --topic "{T}"`

## Workflow: Batch Generate

When asked to generate multiple videos:
1. Pick a domain and topic list
2. Check DB for already-covered topics: `sqlite3 prod_tracker.sqlite "SELECT topic FROM videos WHERE domain='GCP'"`
3. Generate each video sequentially, incrementing question numbers
4. Track all in DB

## Quality Checklist (Self-Review Before Rendering)

Before writing content JSON, verify:
- [ ] `spoken_audio` is 10-20 words per section (count them)
- [ ] `text` is 15-20 words per section
- [ ] Keywords are exact words from `text`
- [ ] Diagram node labels are 1-2 words
- [ ] Diagram direction is LR (<=3 nodes) or TB (>3 nodes)
- [ ] No deprecated service names (check via web search if unsure)
- [ ] `dsl` field is valid stringified JSON
- [ ] 2-3 answer sections total
- [ ] hook_text is punchy and viral-worthy
- [ ] cta_text is actionable
