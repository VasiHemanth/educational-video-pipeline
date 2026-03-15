/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   Educational Video Pipeline — Scene-Based Type System       ║
 * ║                                                              ║
 * ║   Replaces the old AnswerSection-based types with a richer   ║
 * ║   scene architecture supporting multiple visual formats,     ║
 * ║   A/B comparisons, card stacks, and dynamic diagrams.        ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ── Scene Types ─────────────────────────────────────────────────────────────────
// Each type drives a different visual layout and storytelling pattern

export type SceneType =
  | 'hook'           // Legacy: 0-5s curiosity gap opener
  | 'ticker_hook'    // NEW: Animated stat counter or bold question zoom-in
  | 'pain_chaos'     // NEW: X-mark chaos left, blurred question right (tension)
  | 'reveal_diagram' // NEW: Diagram nodes assemble w/ glowing edge animation
  | 'timeline_steps' // NEW: Step-by-step numbered rows slide in one-by-one
  | 'identity_cta'   // NEW: "You now understand X" confirm + subscribe pill
  | 'roadmap'        // Brief "here's what we'll cover" overview
  | 'concept'        // Core educational content (the bulk)
  | 'comparison'     // Side-by-side A/B (before/after, good/bad)
  | 'demo'           // Interactive-style UI mockup or code demo
  | 'synthesis'      // "Putting it all together" — combines all concepts
  | 'problem'        // Problem statement scene
  | 'solution'       // Solution reveal scene
  | 'cta';           // Call to action (follow, save, subscribe)

// ── Visual Formats ──────────────────────────────────────────────────────────────
// Determines which visual component renders in the scene

export type VisualFormat =
  | 'diagram'         // Flowchart / architecture diagram (nodes + edges)
  | 'split_compare'   // Side-by-side A/B comparison panels
  | 'card_stack'      // Stacked numbered cards revealing one by one
  | 'numbered_list'   // Numbered list with icons
  | 'text_only'       // Large kinetic text (for hooks, CTAs)
  | 'code_block'      // Syntax-highlighted code snippet
  | 'metric_counter'  // Animated number/metric reveal
  | 'icon_grid'       // Grid of icons with labels
  | 'ticker_hook'     // NEW: Animated stat/question reveal
  | 'chaos_grid'      // NEW: X-mark chaos items list
  | 'timeline_steps'  // NEW: Numbered step-by-step rows
  | 'floating_code';  // NEW: Glassmorphic code card with typewriter

// ── Keyword Highlighting ────────────────────────────────────────────────────────

export interface KeywordSet {
  tech_terms?: string[];     // Technology/service names → accent color
  action_verbs?: string[];   // Action words → bold
  concepts?: string[];       // Conceptual terms → accent color
}

// ── Visual Data Types ───────────────────────────────────────────────────────────

export interface DiagramNode {
  id: string;
  label: string;       // 1-2 words max
  type: 'compute' | 'storage' | 'database' | 'messaging' | 'user' | 'process' | 'decision';
  iconName?: string;    // Icon identifier (e.g. 'cloud-run', 'database')
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;       // Optional short label on arrow
}

export interface DiagramData {
  direction: 'LR' | 'TB';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface ComparisonData {
  before: {
    label: string;
    description: string;
    status: 'bad' | 'neutral';
    icon?: string;        // Optional icon name
  };
  after: {
    label: string;
    description: string;
    status: 'good' | 'neutral';
    icon?: string;
  };
  metric?: {
    label: string;        // e.g. "Load time"
    beforeValue: string;  // e.g. "2.3s"
    afterValue: string;   // e.g. "0.4s"
  };
}

export interface CardData {
  title: string;
  body: string;
  icon?: string;         // Icon name or emoji
  accentColor?: string;  // Override accent per card
}

export interface CardStackData {
  cards: CardData[];
  labelPrefix?: string;  // e.g. "Secret", "Tip", "Step" → renders as "Secret #1"
}

export interface NumberedListData {
  items: {
    number: number;
    title: string;
    description: string;
    icon?: string;
  }[];
}

export interface CodeBlockData {
  language: string;      // e.g. 'python', 'javascript', 'yaml'
  code: string;
  highlightLines?: number[];  // Lines to glow/highlight
}

export interface MetricCounterData {
  metrics: {
    label: string;
    value: number;
    suffix: string;      // e.g. '%', 'ms', 'x', 'K'
    color?: string;
  }[];
}

export interface IconGridData {
  items: {
    icon: string;
    label: string;
  }[];
  columns?: number;      // Default: auto-calculated
}

// ── NEW: Ticker Hook Data ───────────────────────────────────────────────────────
export interface TickerHookData {
  hookStyle: 'stat' | 'question' | 'paradox' | 'vs';
  stat?: string;           // e.g. "247M"
  statLabel?: string;      // e.g. "containers deployed daily"
  reveal: string;          // e.g. "How?" — the big payoff word
  question?: string;       // Alt: full question text
}

// ── NEW: Chaos Grid Data ─────────────────────────────────────────────────────────
export interface ChaosGridData {
  problems: string[];      // 3–5 short chaos items with X marks
  tagline?: string;        // Footer line: e.g. "There has to be a better way."
}

// ── NEW: Timeline Steps Data ─────────────────────────────────────────────────────
export interface TimelineStepsData {
  steps: {
    n: string;             // Step number/label ("1", "2", etc.)
    title: string;         // Short title (max 3 words)
    detail: string;        // One sentence explanation
    icon?: string;         // Emoji icon
  }[];
}

// ── Union of all visual data types ──────────────────────────────────────────────

export type VisualData =
  | DiagramData
  | ComparisonData
  | CardStackData
  | NumberedListData
  | CodeBlockData
  | MetricCounterData
  | IconGridData
  | TickerHookData
  | ChaosGridData
  | TimelineStepsData
  | null;  // For text_only scenes

// ── Scene Definition ────────────────────────────────────────────────────────────

export interface VideoScene {
  id: string;
  sceneType: SceneType;
  title: string;
  subtitle?: string;
  text: string;                    // On-screen display text (short, punchy)
  spokenAudio: string;             // Voiceover script (can be longer)
  visualFormat: VisualFormat;
  visualData: VisualData;
  keywords: KeywordSet;
  accentColor?: string;            // Override per-scene accent color
  moodColor?: string;              // NEW: Per-scene background mood tint
  transitionStyle?: 'wipe_right' | 'scale_smash' | 'flash' | 'none'; // NEW: Transition out
  voicePacing?: 'fast' | 'normal' | 'slow'; // NEW: Affects voice timing hint
  durationSeconds: number;
  transition?: 'fade' | 'wipe' | 'zoom' | 'none';  // Legacy: transition to NEXT scene
}

// ── Educational Video Content (replaces VideoContent for new pipeline) ──────────

export interface EducationalContent {
  topic: string;
  domain: string;                  // e.g. 'UX Design', 'Cloud Architecture', 'AI/ML'
  title: string;                   // Catchy title for the video
  hookText: string;                // Scroll-stopping curiosity gap text
  ctaText: string;                 // End-of-video call to action
  scenes: VideoScene[];
  hashtags?: string[];
  techTerms?: string[];            // All tech terms across all scenes
}

// ── Scene Timing (calculated by assembler) ──────────────────────────────────────

export interface SceneTiming {
  id: string;
  startFrame: number;
  durationFrames: number;
  // Phase breakdown within each scene:
  phaseText: number;       // Frames for text reveal
  phaseVisual: number;     // Frames for visual element animation
  phaseDwell: number;      // Frames to hold/read
  phaseTransition: number; // Frames for transition out
  voicePath?: string | null;
}

// ── SFX Events (auto-calculated by SFXScheduler) ────────────────────────────────

export type SFXType =
  | 'whoosh'          // Scene enters
  | 'whip'            // Dramatic hook reveal
  | 'pop'             // Element (card/node) appears
  | 'ding'            // Success / "good" state
  | 'click'           // UI interaction
  | 'slide'           // Panel slides in
  | 'pageTurn'        // Transition between scenes
  | 'uiSwitch'        // Toggle / comparison flip
  | 'tick'            // NEW: Mechanical click for counters/steps
  | 'bass_rumble'     // NEW: Deep sub hit for hook entries
  | 'error_buzz'      // NEW: Glitch sound for chaos scenes
  | 'edge_hum'        // NEW: Hum as diagram edges draw
  | 'confirm_chime';  // NEW: 3-note ascending tone for CTA

export interface SFXEvent {
  frame: number;
  sfxType: SFXType;
  volume: number;    // 0-1
  sourceUrl?: string; // Optional absolute URL or base64 string
}

// ── Props for the EducationalReel composition ───────────────────────────────────

export interface EducationalReelProps {
  content: EducationalContent;
  config: {
    bgMusicPath?: string | null;
    platform?: 'youtube' | 'meta';
    totalFrames: number;
    sceneTimings: SceneTiming[];
    sfxEvents: SFXEvent[];
    watermark?: string;
    watermarkSub?: string;
    thumbnail_headline?: string;
    thumbnail_subheadline?: string;
  };
}
