// ── Scene-based video types ─────────────────────────────────────────────────
// The agent generates this JSON fresh for every video.
// No templates. No fixed structure. Full creative control.

export interface Animation {
    type:
        | 'fade-in' | 'fade-out'
        | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right'
        | 'scale-in' | 'scale-out'
        | 'blur-in' | 'blur-out'
        | 'pop'
        | 'stagger-chars' | 'typewriter'
        | 'draw-path'
        | 'none';
    delay?: number;        // frames before animation starts
    duration?: number;     // animation duration in frames
    charDelay?: number;    // for stagger-chars: frames between characters
    spring?: { damping: number; stiffness: number };
}

export interface LoopAnimation {
    type: 'pulse' | 'float' | 'glow' | 'breathe' | 'none';
    intensity?: number;    // 0-1 scale
    speed?: number;        // frames per cycle
}

export interface Position {
    x: number | 'center' | 'left' | 'right';
    y: number | 'center' | 'top' | 'bottom';
    anchor?: 'center' | 'top-left' | 'top-center' | 'bottom-center';
    width?: number | string;
}

export interface TextStyle {
    fontSize: number;
    fontWeight?: number;
    color: string;
    fontFamily?: string;
    letterSpacing?: number;
    textTransform?: 'uppercase' | 'lowercase' | 'none';
    textAlign?: 'left' | 'center' | 'right';
    lineHeight?: number;
    textShadow?: string;
    maxWidth?: number;
}

// ── Layer types ─────────────────────────────────────────────────────────────

export interface TextLayer {
    id: string;
    type: 'text';
    content: string;
    position: Position;
    style: TextStyle;
    enter?: Animation;
    exit?: Animation;
    loop?: LoopAnimation;
}

export interface KineticTextLayer {
    id: string;
    type: 'kinetic-text';
    content: string;
    position: Position;
    style: TextStyle;
    enter?: Animation;    // stagger-chars, typewriter, or standard
    exit?: Animation;
    highlightWords?: { word: string; color: string }[];
}

export interface ListLayer {
    id: string;
    type: 'list';
    items: string[];
    position: Position;
    style: TextStyle;
    bulletStyle?: 'arrow' | 'dash' | 'dot' | 'number' | 'none';
    bulletColor?: string;
    itemSpacing?: number;
    enter?: Animation;     // stagger applied per item
    exit?: Animation;
    highlightWords?: { word: string; color: string }[];
}

export interface ShapeLayer {
    id: string;
    type: 'shape';
    shape: 'rect' | 'circle' | 'line';
    position: Position;
    size: { width: number; height: number };
    style: {
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        borderRadius?: number;
        opacity?: number;
        blur?: number;
        gradient?: string;
    };
    enter?: Animation;
    exit?: Animation;
    loop?: LoopAnimation;
}

export interface SvgLayer {
    id: string;
    type: 'svg';
    svg: string;           // inline SVG markup
    position: Position;
    size: { width: number; height: number };
    style?: { opacity?: number; filter?: string };
    enter?: Animation;     // draw-path or standard
    exit?: Animation;
}

export interface DiagramLayer {
    id: string;
    type: 'diagram';
    position: Position;
    nodes: {
        id: string;
        label: string;
        nodeType?: string;
        iconName?: string;
    }[];
    edges: {
        from: string;
        to: string;
        label?: string;
    }[];
    direction: 'LR' | 'TB';
    nodeStyle: {
        fill?: string;
        border?: string;
        borderRadius?: number;
        color: string;
        fontSize?: number;
        glow?: string;
    };
    edgeStyle: {
        color: string;
        style?: 'solid' | 'dashed' | 'glow';
    };
    iconDomain?: string;
    enter?: Animation;     // per-node entrance
    nodeDelay?: number;    // frames between node appearances
}

export interface ProgressLayer {
    id: string;
    type: 'progress';
    position: Position;
    size: { width: number; height: number };
    style: {
        trackColor: string;
        fillColor: string;
        glow?: boolean;
    };
}

export interface BadgeLayer {
    id: string;
    type: 'badge';
    content: string;
    position: Position;
    style: {
        fontSize: number;
        color: string;
        background?: string;
        borderColor?: string;
        borderRadius?: number;
        padding?: string;
    };
    enter?: Animation;
}

export type Layer =
    | TextLayer
    | KineticTextLayer
    | ListLayer
    | ShapeLayer
    | SvgLayer
    | DiagramLayer
    | ProgressLayer
    | BadgeLayer;

// ── Scene ───────────────────────────────────────────────────────────────────

export interface SceneBackground {
    color: string;
    gradients?: {
        type: 'radial' | 'linear';
        colors: string[];
        position?: { x: number; y: number };
        size?: number;
        blur?: number;
        angle?: number;
    }[];
}

export interface Scene {
    id: string;
    durationFrames: number;
    background: SceneBackground;
    layers: Layer[];
    transition?: {
        type: 'cut' | 'crossfade' | 'slide-left' | 'wipe-down';
        durationFrames?: number;
    };
    audio?: {
        voiceKey?: string;   // maps to voice manifest segment
        sfx?: string;        // sfx identifier
    };
}

// ── Top-level video definition ──────────────────────────────────────────────

export interface ScenesVideo {
    meta: {
        title: string;
        fps: number;
        width: number;
        height: number;
        fontFamily?: string;
    };
    scenes: Scene[];
}
