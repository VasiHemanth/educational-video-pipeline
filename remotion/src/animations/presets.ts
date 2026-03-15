/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   Animation Presets — Centralized Spring & Easing Configs    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

// ── Spring Physics Presets ──────────────────────────────────────────────────────
// Named presets for Remotion's spring() function

export const SPRING_PRESETS = {
  /** Fast, crisp — good for UI elements and small reveals */
  snappy: { damping: 18, stiffness: 180 },

  /** Playful overshoot — good for card pops and emphasis */
  bouncy: { damping: 12, stiffness: 200 },

  /** Slow, smooth — good for large container transitions */
  gentle: { damping: 30, stiffness: 100 },

  /** Tight, satisfying settle — good for diagram nodes */
  tactile: { damping: 14, stiffness: 250, mass: 0.8 },

  /** Heavy landing — good for hook text */
  dramatic: { damping: 20, stiffness: 300, mass: 1.2 },

  /** Very soft ease — good for background elements */
  drift: { damping: 40, stiffness: 60, mass: 1.5 },
} as const;

export type SpringPresetName = keyof typeof SPRING_PRESETS;

// ── Timing Constants ────────────────────────────────────────────────────────────

export const TIMING = {
  /** Frames between sequential element reveals (stagger) */
  STAGGER_FRAMES: 12,

  /** Frames per word during kinetic text reveal */
  FRAMES_PER_WORD: 5,

  /** Pause frames between lines of text */
  LINE_PAUSE_FRAMES: 10,

  /** Frames for scene transition animation */
  TRANSITION_FRAMES: 15,

  /** Frames to hold after all elements are revealed */
  DWELL_FRAMES: 30,

  /** Fade out duration at end of each scene */
  FADE_OUT_FRAMES: 12,

  /** Node stagger in diagrams */
  NODE_STAGGER_FRAMES: 18,

  /** Arrow draws after source node + this delay */
  ARROW_DELAY_AFTER_NODE: 10,

  /** Arrow draw animation duration */
  ARROW_DRAW_FRAMES: 14,
} as const;

// ── Scene Duration Defaults (in seconds) ────────────────────────────────────────

export const SCENE_DURATION = {
  hook: 4,
  roadmap: 5,
  concept: 12,
  comparison: 10,
  demo: 12,
  synthesis: 8,
  cta: 4,
} as const;
