import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';

interface Node { id: string; label: string; type: string; iconName?: string; }
interface Edge { from: string; to: string; label?: string; }
interface Graph { direction: string; nodes: Node[]; edges: Edge[]; }

// ── Layout decision ────────────────────────────────────────────────────────────
// Canvas: 1080×1920. Diagram zone: top 42% → bottom 12% = 46% ≈ 883px usable height.
// LR (horizontal): ≤3 nodes — wide nodes fit in 960px usable width
// TB (vertical):   4-8 nodes — portrait canvas gives ~110-220px per node slot
// GRID (2-row):    9+ nodes
type LayoutMode = 'LR' | 'TB' | 'GRID';

function computeLayout(nodeCount: number): LayoutMode {
    if (nodeCount <= 3) return 'LR';
    if (nodeCount <= 8) return 'TB';
    return 'GRID';
}

// ── Dynamic sizing tiers ───────────────────────────────────────────────────────
// Diagram zone: top 36% → bottom 8% = 56% of 1920 ≈ 1075px usable height
// Each TB node slot = 1075 / nodeCount — size tiers must fit within these slots
function getNodeSizing(nodeCount: number, layout: LayoutMode) {
    if (layout === 'LR') {
        // Horizontal: ≤3 nodes, generous spacing across 960px wide
        return { fontSize: 32, padV: 16, padH: 26, gap: 32, arrowLen: 50, minW: 120, maxW: 320, borderW: 4, arrowSize: 13 };
    }

    // Vertical (TB) — 1075px usable height, slots per node:
    if (nodeCount <= 4) {
        // ~268px/slot → big, bold nodes
        return { fontSize: 36, padV: 16, padH: 36, gap: 24, arrowLen: 50, minW: 240, maxW: 740, borderW: 4, arrowSize: 13 };
    }
    if (nodeCount <= 6) {
        // ~179px/slot → comfortable
        return { fontSize: 28, padV: 12, padH: 26, gap: 18, arrowLen: 36, minW: 200, maxW: 700, borderW: 4, arrowSize: 11 };
    }
    if (nodeCount <= 8) {
        // ~134px/slot → compact but legible
        return { fontSize: 22, padV: 10, padH: 20, gap: 12, arrowLen: 28, minW: 160, maxW: 660, borderW: 3, arrowSize: 9 };
    }
    // 9+ (GRID fallback)
    return { fontSize: 16, padV: 7, padH: 12, gap: 8, arrowLen: 18, minW: 110, maxW: 280, borderW: 2, arrowSize: 7 };
}

export const NativeDiagram: React.FC<{
    dsl: string;
    accent: string;
    phaseA: number;
    phaseB: number
}> = ({ dsl, accent, phaseA, phaseB }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

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

    // ── GRID LAYOUT (2-row wrap for 9+ nodes) ─────────────────────────────────
    if (layout === 'GRID') {
        const cols = Math.ceil(nodeCount / 2);
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: `${sizing.gap * 2}px`,
                width: '100%',
                height: '100%',
            }}>
                {[0, 1].map(row => (
                    <div key={row} style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: `${sizing.gap}px`,
                    }}>
                        {graph.nodes.slice(row * cols, (row + 1) * cols).map((node, i) => {
                            const globalIdx = row * cols + i;
                            const appearFrame = diagramStartFrame + (globalIdx * 12);
                            const nodeSpring = spring({ fps, frame: frame - appearFrame, config: { damping: 14 } });
                            const scale = interpolate(nodeSpring, [0, 1], [0.8, 1]);
                            const opacity = interpolate(nodeSpring, [0, 1], [0, 1]);
                            return (
                                <React.Fragment key={node.id}>
                                    {i > 0 && (
                                        <Arrow
                                            isLR={true}
                                            sizing={sizing}
                                            accent={accent}
                                            opacity={interpolate(spring({ fps, frame: frame - appearFrame + 6 }), [0, 1], [0, 1])}
                                        />
                                    )}
                                    <DiagramNode node={node} accent={accent} sizing={sizing} scale={scale} opacity={opacity} />
                                </React.Fragment>
                            );
                        })}
                    </div>
                ))}
            </div>
        );
    }

    // ── LINEAR LAYOUT (LR or TB) ───────────────────────────────────────────────
    const isLR = layout === 'LR';

    return (
        <div style={{
            display: 'flex',
            flexDirection: isLR ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${sizing.gap}px`,
            width: '100%',
            height: '100%',
        }}>
            {graph.nodes.map((node, i) => {
                const appearFrame = diagramStartFrame + (i * 15);
                const nodeSpring = spring({ fps, frame: frame - appearFrame, config: { damping: 14 } });
                const scale = interpolate(nodeSpring, [0, 1], [0.8, 1]);
                const opacity = interpolate(nodeSpring, [0, 1], [0, 1]);

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
                                opacity={interpolate(spring({ fps, frame: frame - appearFrame + 8 }), [0, 1], [0, 1])}
                            />
                        )}
                        <DiagramNode
                            node={node}
                            accent={accent}
                            sizing={sizing}
                            scale={scale}
                            opacity={opacity}
                        />
                    </React.Fragment>
                );
            })}
        </div>
    );
};

// ── Arrow Component ────────────────────────────────────────────────────────────
const Arrow: React.FC<{
    isLR: boolean;
    sizing: ReturnType<typeof getNodeSizing>;
    accent: string;
    label?: string | null;
    opacity: number;
}> = ({ isLR, sizing, accent, label, opacity }) => (
    <div style={{
        opacity,
        display: 'flex',
        flexDirection: isLR ? 'row' : 'column',
        alignItems: 'center',
        position: 'relative',
        flexShrink: 0,
    }}>
        {label && (
            <div style={{
                position: 'absolute',
                top: isLR ? `-${sizing.fontSize + 6}px` : 'auto',
                left: isLR ? 'auto' : `${sizing.arrowLen + 8}px`,
                color: '#A1A1A6',
                fontSize: `${Math.max(11, sizing.fontSize - 7)}px`,
                fontWeight: 600,
                letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
            }}>
                {label}
            </div>
        )}
        {/* Arrow shaft */}
        <div style={{
            width: isLR ? `${sizing.arrowLen}px` : '3px',
            height: isLR ? '3px' : `${sizing.arrowLen}px`,
            backgroundColor: '#48484A',
            borderRadius: '2px',
        }} />
        {/* Arrow head */}
        <div style={{
            width: 0,
            height: 0,
            borderTop: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
            borderBottom: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
            borderLeft: isLR ? `${sizing.arrowSize + 4}px solid #48484A` : `${sizing.arrowSize}px solid transparent`,
            borderRight: isLR ? 'none' : `${sizing.arrowSize}px solid transparent`,
            borderTopColor: isLR ? 'transparent' : '#48484A',
            marginTop: isLR ? 0 : '-2px',
            marginLeft: isLR ? '-2px' : 0,
        }} />
    </div>
);

// ── Node Component ─────────────────────────────────────────────────────────────
const DiagramNode: React.FC<{
    node: Node;
    accent: string;
    sizing: ReturnType<typeof getNodeSizing>;
    scale: number;
    opacity: number;
}> = ({ node, accent, sizing, scale, opacity }) => (
    <div style={{
        transform: `scale(${scale})`,
        opacity,
        padding: `${sizing.padV}px ${sizing.padH}px`,
        backgroundColor: 'transparent',
        border: `${sizing.borderW}px solid ${accent}`,
        borderRadius: node.type === 'database' || node.type === 'storage' ? '40px' : '16px',
        color: '#F5F5F7',
        fontSize: `${sizing.fontSize}px`,
        fontWeight: 700,
        boxShadow: `inset 0 0 20px ${accent}15, 0 0 25px ${accent}20`,
        textAlign: 'center' as const,
        minWidth: `${sizing.minW}px`,
        maxWidth: `${sizing.maxW}px`,
        wordBreak: 'break-word' as const,
        display: 'flex',
        flexDirection: 'row' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${sizing.padH * 0.6}px`, // Add space between icon and text instead of margin
    }}>
        {node.iconName && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Img
                    src={staticFile(`icons/gcp/${node.iconName.toLowerCase().replace(/[-\s]+/g, '_')}.svg`)}
                    style={{
                        height: `${Math.max(28, sizing.fontSize * 1.6)}px`,
                        width: 'auto',
                        filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.5))`
                    }}
                    onError={(e) => {
                        // Hide broken icons if LLM hallucinates a service name
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
