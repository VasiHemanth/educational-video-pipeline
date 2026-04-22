import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { DesignProps } from '../types';
import { mergeDesign } from '../designDefaults';

interface Node { id: string; label: string; type: string; iconName?: string; }
interface Edge { from: string; to: string; label?: string; }
interface Graph { direction: string; nodes: Node[]; edges: Edge[]; }

type LayoutMode = 'LR' | 'TB' | 'GRID';

function computeLayout(nodeCount: number): LayoutMode {
    if (nodeCount <= 3) return 'LR';
    if (nodeCount <= 8) return 'TB';
    return 'GRID';
}

function getNodeSizing(nodeCount: number, layout: LayoutMode) {
    if (layout === 'LR') {
        return { fontSize: 32, padV: 16, padH: 26, gap: 32, arrowLen: 50, minW: 120, maxW: 320, borderW: 4, arrowSize: 13 };
    }
    if (nodeCount <= 4) {
        return { fontSize: 36, padV: 16, padH: 36, gap: 24, arrowLen: 50, minW: 240, maxW: 740, borderW: 4, arrowSize: 13 };
    }
    if (nodeCount <= 6) {
        return { fontSize: 28, padV: 12, padH: 26, gap: 18, arrowLen: 36, minW: 200, maxW: 700, borderW: 4, arrowSize: 11 };
    }
    if (nodeCount <= 8) {
        return { fontSize: 22, padV: 10, padH: 20, gap: 12, arrowLen: 28, minW: 160, maxW: 660, borderW: 3, arrowSize: 9 };
    }
    return { fontSize: 16, padV: 7, padH: 12, gap: 8, arrowLen: 18, minW: 110, maxW: 280, borderW: 2, arrowSize: 7 };
}

// ── Node style variants driven by design.diagrams.nodeStyle ──
function getNodeVisualStyle(nodeStyle: string, accent: string, borderW: number, nodeType: string, nodeShapes: Record<string, string>) {
    const shape = nodeShapes[nodeType] || 'rounded-rect';
    const borderRadius = shape === 'pill' ? '40px' : shape === 'circle' ? '50%' : shape === 'diamond' ? '8px' : '16px';

    switch (nodeStyle) {
        case 'filled':
            return {
                backgroundColor: accent,
                border: 'none',
                borderRadius,
                color: '#000000',
                boxShadow: `0 4px 20px ${accent}40`,
            };
        case 'glass':
            return {
                backgroundColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                border: `${borderW}px solid rgba(255,255,255,0.15)`,
                borderRadius,
                color: '#F5F5F7',
                boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 0 20px ${accent}10`,
            };
        case 'gradient':
            return {
                background: `linear-gradient(135deg, ${accent}CC, ${accent}44)`,
                border: 'none',
                borderRadius,
                color: '#FFFFFF',
                boxShadow: `0 4px 25px ${accent}30`,
            };
        case 'neon':
            return {
                backgroundColor: 'transparent',
                border: `${borderW}px solid ${accent}`,
                borderRadius,
                color: accent,
                boxShadow: `0 0 15px ${accent}60, inset 0 0 15px ${accent}20, 0 0 40px ${accent}20`,
                textShadow: `0 0 10px ${accent}80`,
            };
        case 'bordered':
        default:
            return {
                backgroundColor: 'transparent',
                border: `${borderW}px solid ${accent}`,
                borderRadius,
                color: '#F5F5F7',
                boxShadow: `inset 0 0 20px ${accent}15, 0 0 25px ${accent}20`,
            };
    }
}

// ── Edge style variants driven by design.diagrams.edgeStyle ──
function getEdgeColor(edgeStyle: string, designEdgeColor: string, accent: string) {
    switch (edgeStyle) {
        case 'glow': return accent;
        case 'dashed': return designEdgeColor;
        case 'solid':
        default: return designEdgeColor;
    }
}

export const NativeDiagram: React.FC<{
    dsl: string;
    accent: string;
    phaseA: number;
    phaseB: number;
    design?: DesignProps;
}> = ({ dsl, accent, phaseA, phaseB, design: rawDesign }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const d = mergeDesign(rawDesign);
    const diagDesign = d.diagrams;
    const entranceAnim = d.animations.diagramEntrance;

    let graph: Graph;
    try {
        graph = typeof dsl === 'string' ? JSON.parse(dsl) : dsl;
    } catch {
        return <div style={{ color: '#EA4335', fontSize: '24px' }}>Invalid Diagram JSON</div>;
    }

    const nodeCount = graph.nodes.length;
    const layout = computeLayout(nodeCount);
    const sizing = getNodeSizing(nodeCount, layout);
    const diagramStartFrame = phaseA + phaseB;

    // ── Entrance animation per node ──
    const getNodeAnimation = (index: number) => {
        const delay = index * entranceAnim.nodeDelay;
        const appearFrame = diagramStartFrame + delay;
        const nodeSpring = spring({ fps, frame: frame - appearFrame, config: { damping: entranceAnim.spring.damping, stiffness: entranceAnim.spring.stiffness } });

        switch (entranceAnim.type) {
            case 'cascade': {
                const y = interpolate(nodeSpring, [0, 1], [-40, 0]);
                return { transform: `translateY(${y}px)`, opacity: interpolate(nodeSpring, [0, 1], [0, 1]) };
            }
            case 'fade-cascade': {
                const y = interpolate(nodeSpring, [0, 1], [20, 0]);
                return { transform: `translateY(${y}px)`, opacity: interpolate(nodeSpring, [0, 1], [0, 1]) };
            }
            case 'draw-edges':
            case 'pop-in':
            default: {
                const scale = interpolate(nodeSpring, [0, 1], [0.8, 1]);
                return { transform: `scale(${scale})`, opacity: interpolate(nodeSpring, [0, 1], [0, 1]) };
            }
        }
    };

    const getEdgeAnimation = (index: number) => {
        const delay = index * entranceAnim.nodeDelay;
        const appearFrame = diagramStartFrame + delay + 8;
        const edgeSpring = spring({ fps, frame: frame - appearFrame, config: { damping: 60, stiffness: 80 } });
        const progress = interpolate(edgeSpring, [0, 1], [0, 1]);
        return {
            opacity: progress,
            drawProgress: progress,
        };
    };

    // ── GRID LAYOUT ──
    if (layout === 'GRID') {
        const cols = Math.ceil(nodeCount / 2);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: `${sizing.gap * 2}px`, width: '100%', height: '100%' }}>
                {[0, 1].map(row => (
                    <div key={row} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: `${sizing.gap}px` }}>
                        {graph.nodes.slice(row * cols, (row + 1) * cols).map((node, i) => {
                            const globalIdx = row * cols + i;
                            const anim = getNodeAnimation(globalIdx);
                            const edgeAnim = getEdgeAnimation(globalIdx);
                            return (
                                <React.Fragment key={node.id}>
                                    {i > 0 && (
                                        <Arrow isLR={true} sizing={sizing} accent={accent} opacity={edgeAnim.opacity} drawProgress={edgeAnim.drawProgress} edgeStyle={diagDesign.edgeStyle} edgeColor={diagDesign.edgeColor} />
                                    )}
                                    <DiagramNode node={node} accent={accent} sizing={sizing} nodeAnim={anim} design={d} />
                                </React.Fragment>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    // ── LINEAR LAYOUT ──
    const isLR = layout === 'LR';

    return (
        <div style={{
            display: 'flex', flexDirection: isLR ? 'row' : 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: `${sizing.gap}px`, width: '100%', height: '100%',
        }}>
            {graph.nodes.map((node, i) => {
                const anim = getNodeAnimation(i);
                const edgeAnim = getEdgeAnimation(i);
                const hasIncomingEdge = i > 0;
                const edgeLabel = hasIncomingEdge
                    ? graph.edges?.find(e => e.to === node.id && e.from === graph.nodes[i - 1].id)?.label
                    : null;

                return (
                    <React.Fragment key={node.id}>
                        {hasIncomingEdge && (
                            <Arrow
                                isLR={isLR}
                                sizing={sizing}
                                accent={accent}
                                label={edgeLabel}
                                opacity={edgeAnim.opacity}
                                drawProgress={edgeAnim.drawProgress}
                                edgeStyle={diagDesign.edgeStyle}
                                edgeColor={diagDesign.edgeColor}
                            />
                        )}
                        <DiagramNode node={node} accent={accent} sizing={sizing} nodeAnim={anim} design={d} />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ── Arrow Component ──
const Arrow: React.FC<{
    isLR: boolean;
    sizing: ReturnType<typeof getNodeSizing>;
    accent: string;
    label?: string | null;
    opacity: number;
    drawProgress?: number;
    edgeStyle: string;
    edgeColor: string;
}> = ({ isLR, sizing, accent, label, opacity, drawProgress = 1, edgeStyle, edgeColor }) => {
    const color = getEdgeColor(edgeStyle, edgeColor, accent);
    const isDashed = edgeStyle === 'dashed';
    const isGlow = edgeStyle === 'glow';

    // Animate line dimension from 0 → full length, arrowhead appears at 85%+
    const lineW = isLR ? `${sizing.arrowLen * drawProgress}px` : '3px';
    const lineH = isLR ? '3px' : `${sizing.arrowLen * drawProgress}px`;
    const arrowheadOpacity = drawProgress > 0.85 ? interpolate(drawProgress, [0.85, 1], [0, 1]) : 0;

    return (
        <div style={{
            opacity, display: 'flex',
            flexDirection: isLR ? 'row' : 'column',
            alignItems: 'center', position: 'relative', flexShrink: 0,
        }}>
            {label && (
                <div style={{
                    position: 'absolute',
                    top: isLR ? `-${sizing.fontSize + 6}px` : 'auto',
                    left: isLR ? 'auto' : `${sizing.arrowLen + 8}px`,
                    color: '#A1A1A6', fontSize: `${Math.max(11, sizing.fontSize - 7)}px`,
                    fontWeight: 600, letterSpacing: '0.5px', whiteSpace: 'nowrap', textTransform: 'uppercase',
                }}>
                    {label}
                </div>
            )}
            <div style={{
                width: lineW,
                height: lineH,
                backgroundColor: isDashed ? 'transparent' : color,
                borderRadius: '2px',
                ...(isDashed ? {
                    borderTop: isLR ? `3px dashed ${color}` : 'none',
                    borderLeft: !isLR ? `3px dashed ${color}` : 'none',
                } : {}),
                ...(isGlow ? { boxShadow: `0 0 8px ${color}60` } : {}),
            }} />
            <div style={{
                opacity: arrowheadOpacity,
                width: 0, height: 0,
                borderTop: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
                borderBottom: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
                borderLeft: isLR ? `${sizing.arrowSize + 4}px solid ${color}` : `${sizing.arrowSize}px solid transparent`,
                borderRight: isLR ? 'none' : `${sizing.arrowSize}px solid transparent`,
                borderTopColor: isLR ? 'transparent' : color,
                marginTop: isLR ? 0 : '-2px',
                marginLeft: isLR ? '-2px' : 0,
                ...(isGlow ? { filter: `drop-shadow(0 0 6px ${color}60)` } : {}),
            }} />
        </div>
    );
};

// ── Node Component ──
const DiagramNode: React.FC<{
    node: Node;
    accent: string;
    sizing: ReturnType<typeof getNodeSizing>;
    nodeAnim: { transform: string; opacity: number };
    design: DesignProps;
}> = ({ node, accent, sizing, nodeAnim, design }) => {
    const visualStyle = getNodeVisualStyle(
        design.diagrams.nodeStyle,
        accent,
        sizing.borderW,
        node.type,
        design.diagrams.nodeShapes,
    );
    const iconDomain = design.diagrams.iconDomain;

    return (
        <div style={{
            transform: nodeAnim.transform,
            opacity: nodeAnim.opacity,
            padding: `${sizing.padV}px ${sizing.padH}px`,
            ...visualStyle,
            fontSize: `${sizing.fontSize}px`,
            fontWeight: 700,
            textAlign: 'center' as const,
            minWidth: `${sizing.minW}px`,
            maxWidth: `${sizing.maxW}px`,
            wordBreak: 'break-word' as const,
            display: 'flex',
            flexDirection: 'row' as const,
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${sizing.padH * 0.6}px`,
        }}>
            {node.iconName && (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Img
                        src={staticFile(`icons/${iconDomain}/${node.iconName.toLowerCase().replace(/[-\s]+/g, '_')}.svg`)}
                        style={{
                            height: `${Math.max(28, sizing.fontSize * 1.6)}px`,
                            width: 'auto',
                            filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.5))`,
                        }}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
            )}
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                {node.label}
            </div>
        </div>
    );
};
