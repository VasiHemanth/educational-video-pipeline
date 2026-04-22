# /design-video

Dynamically generate visual design decisions for a video. Every video gets a unique look — YOU are the designer.

## Usage

```
/design-video --number <N> [--mood <mood>] [--style <style>]
```

Examples:
```
/design-video --number 101
/design-video --number 42 --mood intense --style cyberpunk
/design-video --number 200 --mood calm --style minimal
```

## What This Skill Does

You (the AI agent) make ALL visual design decisions for this specific video:
- Color palette based on domain + topic mood
- Animation types and timing for every element
- Custom SVG assets (icons, decorative elements, backgrounds)
- Typography choices
- Diagram visual style
- Transition effects between sections
- Background effects and atmosphere

**You are NOT applying a template.** You are making fresh creative decisions based on:
1. The topic's emotional weight (security = intense reds, scaling = expansive blues)
2. The domain identity (AWS = orange/dark, GCP = blue/white, K8s = blue-purple)
3. The content density (fewer sections = more dramatic timing, more = tighter)
4. Engagement psychology (scroll-stop in 0.3s, 4-chunk cognitive limit)

## Steps

### 1. Read the Content JSON

Read `output_prod/q{N}_content.json` to understand:
- Domain and topic
- Number of sections and their complexity
- Diagram complexity (node count, edge count)
- Keywords and tech terms

### 2. Make Creative Decisions

Think about:
- **Mood**: Is this topic urgent (latency, outages), foundational (architecture), or exploratory (new tech)?
- **Energy level**: High energy = fast animations, bright accents, bold type. Low energy = smooth transitions, muted tones, elegant type.
- **Visual metaphor**: What visual language fits? (circuits for networking, layers for stacks, flow for pipelines)

### 3. Generate Color Palette

Choose colors that match domain + mood:

| Domain | Base Identity | Adapt Based On Topic |
|--------|--------------|---------------------|
| AWS | `#FF9900` orange, `#232F3E` dark | Security = add red. Serverless = add purple. Data = add teal. |
| GCP | `#4285F4` blue, `#EA4335` red | ML/AI = add violet. Network = add green. Storage = add amber. |
| Azure | `#0078D4` blue, `#50E6FF` cyan | DevOps = add orange. Security = add red. Data = add green. |
| Kubernetes | `#326CE5` blue | Networking = add teal. Security = add red. Scaling = add green. |
| Terraform | `#7B42BC` purple | Multi-cloud = rainbow accents. State = add amber. Modules = add green. |
| GenAI | `#FF6F61` coral | RAG = add blue. Agents = add purple. Training = add green. |
| System Design | `#2997FF` blue | Caching = add amber. Scaling = add green. Queues = add purple. |
| DevOps | `#F4811F` orange | CI/CD = add green. Security = add red. Monitoring = add blue. |

### 4. Choose Animations

Pick from these supported animation types:

**Intro entrance** (`animations.intro.type`):
- `slide-up` — Element springs up from below. Clean, professional.
- `scale-in` — Scales from 0.8 to 1.0 with overshoot. Punchy.
- `stagger-chars` — Characters appear one by one. Dramatic, scroll-stopping.
- `typewriter` — Cursor-style character reveal. Technical feel.
- `blur-in` — Fades in from blur to sharp. Cinematic.

**Text reveal** (`animations.textReveal.type`):
- `line-by-line` — Lines appear sequentially with stagger. Default, reliable.
- `word-by-word` — Words highlight as spoken. Great with voice.
- `highlight-sweep` — Gradient sweep illuminates text left to right. Premium feel.
- `fade-lines` — Each line fades in independently. Calm, measured.

**Diagram entrance** (`animations.diagramEntrance.type`):
- `pop-in` — Nodes spring in with scale overshoot. Playful.
- `cascade` — Nodes drop in from top sequentially. Structured.
- `draw-edges` — Edges draw themselves as SVG paths, then nodes pop. Technical.
- `fade-cascade` — Nodes fade in with slight upward drift. Subtle.

**Section transition** (`animations.transition.type`):
- `cut` — Instant switch. Fast pace.
- `crossfade` — 8-frame opacity blend. Smooth.
- `slide-left` — Current slides out, next slides in. Dynamic.
- `wipe-down` — Vertical wipe reveal. Cinematic.

**Outro** (`animations.outro.type`):
- `pulse-cta` — CTA button pulses. Standard.
- `expand-rings` — Concentric rings expand outward. Energetic.
- `zoom-reveal` — Text scales up from small. Dramatic.

### 5. Design Diagram Nodes

Choose diagram visual style:
- `bordered` — Transparent fill, colored border. Clean. (current default)
- `filled` — Solid background fill with dark text. Bold.
- `glass` — Frosted glass effect with blur. Premium.
- `gradient` — Gradient fill matching palette. Rich.
- `neon` — Glow border + dark fill. Cyberpunk.

### 6. Create Custom SVG Assets (Optional)

If the topic would benefit from custom visuals, create inline SVG markup:
- Background patterns (circuit board traces, cloud shapes, grid lines)
- Custom icons for services that don't have icon files
- Decorative elements (arrows, brackets, emphasis marks)

Write SVG as a string in the `svgAssets` array. Keep SVGs simple — they render at 1080x1920.

### 7. Write Design JSON

Write `output_prod/q{N}_design.json` following this schema:

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
      "type": "stagger-chars",
      "spring": { "damping": 80, "stiffness": 100 },
      "staggerDelay": 2
    },
    "textReveal": {
      "type": "line-by-line",
      "staggerDelay": 8
    },
    "diagramEntrance": {
      "type": "pop-in",
      "nodeDelay": 15,
      "spring": { "damping": 14, "stiffness": 170 }
    },
    "transition": {
      "type": "crossfade",
      "durationFrames": 8
    },
    "outro": {
      "type": "pulse-cta",
      "spring": { "damping": 12, "stiffness": 80 }
    }
  },
  "effects": {
    "backgroundType": "radial-glow",
    "glowColors": ["#FF990020", "#2997FF15"],
    "glowIntensity": 0.7,
    "glowBlur": 100,
    "vignette": false,
    "noise": false,
    "scanlines": false
  },
  "diagrams": {
    "nodeStyle": "bordered",
    "edgeStyle": "solid",
    "edgeColor": "#48484A",
    "nodeShapes": {
      "compute": "rounded-rect",
      "database": "pill",
      "storage": "pill",
      "messaging": "rounded-rect",
      "user": "rounded-rect"
    },
    "glowOnActive": true,
    "iconDomain": "aws"
  },
  "layout": {
    "introTextTop": "20%",
    "sectionTitleTop": 200,
    "sectionTextTop": 320,
    "diagramTop": "36%",
    "diagramBottom": "8%",
    "progressBar": true,
    "progressBarStyle": "glow",
    "bulletStyle": "arrow"
  },
  "svgAssets": []
}
```

### 8. Self-Review

Verify:
- [ ] Palette has enough contrast (text on background, keywords on body)
- [ ] Animation types are all from the supported list above
- [ ] Spring configs are reasonable (damping 10-100, stiffness 50-200)
- [ ] Diagram node style matches the mood
- [ ] iconDomain matches the content's domain
- [ ] sectionAccents array has enough entries for all sections

## Design Principles

1. **0.3s scroll-stop**: Frame 1 must have visible motion + color. Never start with a blank screen.
2. **4-chunk cognitive limit**: Max 4 visual elements competing for attention at any moment.
3. **Sequential revelation**: Voice leads, text follows, diagram draws last.
4. **Domain identity**: Users should recognize the domain from the color palette alone.
5. **Contrast hierarchy**: Most important info = highest contrast. Supporting info = muted.
6. **Mobile-first**: Everything readable on 6-inch screen. Node labels 1-2 words. Body text 36px+.
