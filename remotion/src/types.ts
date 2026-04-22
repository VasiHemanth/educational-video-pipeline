// ── Design JSON types (agent-generated per video) ──────────────────────────

export interface DesignPalette {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textMuted: string;
    gradients: {
        introGlow: string[];
        sectionAccents: string[];
        cta: string[];
    };
}

export interface DesignTypography {
    fontFamily: string;
    hookSize: number;
    titleSize: number;
    bodySize: number;
    labelSize: number;
    titleWeight: number;
    bodyWeight: number;
    keywordWeight: number;
}

export interface SpringConfig {
    damping: number;
    stiffness: number;
}

export interface DesignAnimations {
    intro: {
        type: 'slide-up' | 'scale-in' | 'stagger-chars' | 'typewriter' | 'blur-in';
        spring: SpringConfig;
        staggerDelay?: number;
    };
    textReveal: {
        type: 'line-by-line' | 'word-by-word' | 'highlight-sweep' | 'fade-lines';
        staggerDelay: number;
    };
    diagramEntrance: {
        type: 'pop-in' | 'cascade' | 'draw-edges' | 'fade-cascade';
        nodeDelay: number;
        spring: SpringConfig;
    };
    transition: {
        type: 'cut' | 'crossfade' | 'slide-left' | 'wipe-down';
        durationFrames: number;
    };
    outro: {
        type: 'pulse-cta' | 'expand-rings' | 'zoom-reveal';
        spring: SpringConfig;
    };
}

export interface DesignEffects {
    backgroundType: 'radial-glow' | 'mesh-gradient' | 'none';
    glowColors: string[];
    glowIntensity: number;
    glowBlur: number;
    vignette: boolean;
    noise: boolean;
    scanlines: boolean;
}

export interface DesignDiagrams {
    nodeStyle: 'bordered' | 'filled' | 'glass' | 'gradient' | 'neon';
    edgeStyle: 'solid' | 'dashed' | 'glow';
    edgeColor: string;
    nodeShapes: Record<string, 'rounded-rect' | 'pill' | 'circle' | 'diamond'>;
    glowOnActive: boolean;
    iconDomain: string;
}

export interface DesignLayout {
    introTextTop: string;
    sectionTitleTop: number;
    sectionTextTop: number;
    diagramTop: string;
    diagramBottom: string;
    progressBar: boolean;
    progressBarStyle: 'glow' | 'solid' | 'none';
    bulletStyle: 'arrow' | 'dash' | 'dot' | 'number';
}

export interface SvgAsset {
    id: string;
    svg: string;
    placement: 'background' | 'overlay';
    opacity: number;
}

export interface DesignProps {
    palette: DesignPalette;
    typography: DesignTypography;
    animations: DesignAnimations;
    effects: DesignEffects;
    diagrams: DesignDiagrams;
    layout: DesignLayout;
    svgAssets?: SvgAsset[];
}

// ── Content & Video types ──────────────────────────────────────────────────

export interface DiagramInfo {
    section_id: string;
    excalidrawPath?: string;
    pngPath?: string;
    isNative?: boolean;
    dsl?: string;
}

export interface AnswerSection {
    id: string;
    title: string;
    text: string;
    spoken_audio?: string;  // Optional fallback if text is empty
    keywords: {
        tech_terms?: string[];
        action_verbs?: string[];
        concepts?: string[];
    };
    duration_seconds: number;
}

export interface VideoContent {
    topic: string;
    question_number: string;
    question_text: string;
    hook_text?: string;
    cta_text?: string;
    title_card_text?: string;   // short catchy subtitle used as scroll-stopping hero text
    tech_terms?: string[];
    domain?: string;
    answer_sections: AnswerSection[];
    config?: {
        animStyle?: string;
        pauseFrames?: number;
        useHook?: boolean;
        bgMusicPath?: string | null;
        platform?: 'youtube' | 'meta';
    };
}

export interface SectionTiming {
    id: string;
    startFrame: number;
    durationFrames: number;
    phaseAFrames: number;
    phaseBFrames: number;
    phaseCFrames: number;
    phaseDFrames: number;
    voicePath?: string | null;
}

export interface VideoProps {
    content: VideoContent;
    diagrams: DiagramInfo[];
    design?: DesignProps;
    config?: {
        animStyle?: string;
        pauseFrames?: number;
        useHook?: boolean;
        bgMusicPath?: string | null;
        platform?: 'youtube' | 'meta';
        introFrames?: number;
        outroFrames?: number;
        totalFrames?: number;
        sectionTimings?: SectionTiming[];
        thumbnail_headline?: string;
        thumbnail_subheadline?: string;
        introVoicePath?: string | null;
        outroVoicePath?: string | null;
        sfx?: {
            whoosh?: string | null;
            pop?: string | null;
        };
    };
    fps?: number;
}
