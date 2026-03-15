/**
 * Design System — Signal Stage Theme
 *
 * A more editorial, stage-led system for educational reels:
 * - Deeper navy canvas instead of pure black
 * - Electric-but-soft accents that still read in motion
 * - Stronger display typography and glass panel shadows
 */

export const COLORS = {
  bg: '#07111c',
  bgDark: '#04080f',
  surface: '#0d1828',
  surfaceElevated: '#132338',
  border: '#20354c',
  gridLines: 'rgba(135, 166, 204, 0.08)',

  textWhite: '#f5f9ff',
  textMuted: '#9db2c9',
  textDim: '#607489',

  neonCyan: '#61e4ff',
  neonMagenta: '#ff6b78',
  neonPurple: '#818cff',
  neonGreen: '#92ff7a',
  neonYellow: '#ffd76a',
  neonOrange: '#ff9b54',

  success: '#92ff7a',
  error: '#ff6b78',
  warning: '#ffb85c',
} as const;

export const ACCENT_CYCLE = [
  COLORS.neonCyan,
  COLORS.neonOrange,
  COLORS.neonGreen,
  COLORS.neonPurple,
  COLORS.neonMagenta,
  COLORS.neonYellow,
] as const;

export const MOOD_COLORS = {
  mystery: '#081425',
  tension: '#1a0d14',
  resolution: '#081a23',
  depth: '#0d1525',
  win: '#121a2d',
  default: COLORS.bg,
} as const;

export const getMoodColor = (sceneType: string, override?: string): string => {
  if (override) return override;
  const map: Record<string, string> = {
    ticker_hook: MOOD_COLORS.mystery,
    hook: MOOD_COLORS.mystery,
    pain_chaos: MOOD_COLORS.tension,
    problem: MOOD_COLORS.tension,
    reveal_diagram: MOOD_COLORS.resolution,
    solution: MOOD_COLORS.resolution,
    timeline_steps: MOOD_COLORS.depth,
    concept: MOOD_COLORS.depth,
    identity_cta: MOOD_COLORS.win,
    cta: MOOD_COLORS.win,
    synthesis: MOOD_COLORS.win,
  };
  return map[sceneType] || MOOD_COLORS.default;
};

export const FONTS = {
  display: "'Avenir Next Condensed', 'Avenir Next', 'SF Pro Display', sans-serif",
  primary: "'Avenir Next', 'Inter', 'SF Pro Display', sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Consolas', monospace",
} as const;

export const FONT_SIZES = {
  hero: 82,
  title: 48,
  body: 34,
  bodySmall: 26,
  label: 18,
  caption: 13,
} as const;

export const LAYOUT = {
  width: 1080,
  height: 1920,
  paddingX: 72,
  safeTop: 176,
  safeBottom: 56,
  titleTop: 176,
  textTop: 318,
  textHeight: '24%',
  diagramTop: '33%',
  diagramBottom: '8%',
  watermarkBottom: 56,
  watermarkLeft: 72,
} as const;

export const EFFECTS = {
  neonGlow: (color: string, intensity = 1) =>
    `0 0 ${14 * intensity}px ${color}66, 0 0 ${34 * intensity}px ${color}22`,
  innerGlow: (color: string, opacity = 0.12) =>
    `inset 0 0 24px ${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`,
  outerGlow: (color: string, opacity = 0.24) =>
    `0 0 80px ${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`,
  textShadow: '0 10px 30px rgba(0, 0, 0, 0.38)',
  panelShadow:
    '0 28px 70px rgba(1, 8, 18, 0.52), 0 8px 18px rgba(1, 8, 18, 0.36)',
  cardShadow: (depth: number) =>
    `0 ${depth * 8}px ${depth * 24}px rgba(3, 10, 18, ${0.22 + depth * 0.12})`,
} as const;
