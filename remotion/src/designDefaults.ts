import { DesignProps } from './types';

/**
 * Default design values — used when no design JSON is provided.
 * Matches the original hardcoded Apple-style look so existing videos
 * render identically without a design JSON.
 */
export const DEFAULT_DESIGN: DesignProps = {
    palette: {
        background: '#0A0A0A',
        surface: '#1C1C1E',
        primary: '#2997FF',
        secondary: '#BF5AF2',
        accent: '#2997FF',
        text: '#F5F5F7',
        textMuted: '#86868B',
        gradients: {
            introGlow: ['#BF5AF220', '#2997FF20', '#FF9F0A15'],
            sectionAccents: ['#2997FF', '#BF5AF2', '#FF9F0A', '#32D74B'],
            cta: ['#2997FF', '#2997FF'],
        },
    },
    typography: {
        fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
        hookSize: 64,
        titleSize: 40,
        bodySize: 40,
        labelSize: 20,
        titleWeight: 800,
        bodyWeight: 400,
        keywordWeight: 700,
    },
    animations: {
        intro: {
            type: 'slide-up',
            spring: { damping: 80, stiffness: 100 },
            staggerDelay: 2,
        },
        textReveal: {
            type: 'line-by-line',
            staggerDelay: 8,
        },
        diagramEntrance: {
            type: 'pop-in',
            nodeDelay: 15,
            spring: { damping: 14, stiffness: 170 },
        },
        transition: {
            type: 'cut',
            durationFrames: 0,
        },
        outro: {
            type: 'pulse-cta',
            spring: { damping: 12, stiffness: 80 },
        },
    },
    effects: {
        backgroundType: 'radial-glow',
        glowColors: ['#BF5AF220', '#2997FF20', '#FF9F0A15'],
        glowIntensity: 0.7,
        glowBlur: 100,
        vignette: false,
        noise: false,
        scanlines: false,
    },
    diagrams: {
        nodeStyle: 'bordered',
        edgeStyle: 'solid',
        edgeColor: '#48484A',
        nodeShapes: {
            compute: 'rounded-rect',
            database: 'pill',
            storage: 'pill',
            messaging: 'rounded-rect',
            user: 'rounded-rect',
        },
        glowOnActive: true,
        iconDomain: 'gcp',
    },
    layout: {
        introTextTop: '20%',
        sectionTitleTop: 200,
        sectionTextTop: 320,
        diagramTop: '36%',
        diagramBottom: '8%',
        progressBar: true,
        progressBarStyle: 'glow',
        bulletStyle: 'arrow',
    },
    svgAssets: [],
};

/** Deep merge design with defaults — any missing field gets the default */
export function mergeDesign(partial?: Partial<DesignProps>): DesignProps {
    if (!partial) return DEFAULT_DESIGN;
    return {
        palette: { ...DEFAULT_DESIGN.palette, ...partial.palette, gradients: { ...DEFAULT_DESIGN.palette.gradients, ...partial.palette?.gradients } },
        typography: { ...DEFAULT_DESIGN.typography, ...partial.typography },
        animations: {
            intro: { ...DEFAULT_DESIGN.animations.intro, ...partial.animations?.intro },
            textReveal: { ...DEFAULT_DESIGN.animations.textReveal, ...partial.animations?.textReveal },
            diagramEntrance: { ...DEFAULT_DESIGN.animations.diagramEntrance, ...partial.animations?.diagramEntrance },
            transition: { ...DEFAULT_DESIGN.animations.transition, ...partial.animations?.transition },
            outro: { ...DEFAULT_DESIGN.animations.outro, ...partial.animations?.outro },
        },
        effects: { ...DEFAULT_DESIGN.effects, ...partial.effects },
        diagrams: { ...DEFAULT_DESIGN.diagrams, ...partial.diagrams, nodeShapes: { ...DEFAULT_DESIGN.diagrams.nodeShapes, ...partial.diagrams?.nodeShapes } },
        layout: { ...DEFAULT_DESIGN.layout, ...partial.layout },
        svgAssets: partial.svgAssets ?? DEFAULT_DESIGN.svgAssets,
    };
}

/** Get the bullet character for a given style */
export function getBulletChar(style: string, index: number): string {
    switch (style) {
        case 'arrow': return '\u25B8';
        case 'dash': return '\u2014';
        case 'dot': return '\u2022';
        case 'number': return `${index + 1}.`;
        default: return '\u25B8';
    }
}
