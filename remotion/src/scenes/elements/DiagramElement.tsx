import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig, Img, staticFile } from 'remotion';
import { DiagramLayer } from '../types';
import { resolvePosition } from '../animations';

export const DiagramElement: React.FC<{ layer: DiagramLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const delay = layer.enter?.delay ?? 0;
    const nodeDelay = layer.nodeDelay ?? 15;
    const springCfg = layer.enter?.spring ?? { damping: 14, stiffness: 170 };
    const enterType = layer.enter?.type ?? 'pop';

    const isLR = layer.direction === 'LR';
    const nodeCount = layer.nodes.length;

    // Dynamic sizing
    const sizing = nodeCount <= 3
        ? { fontSize: 32, padV: 16, padH: 26, gap: 32, arrowLen: 50, minW: 120, maxW: 320, arrowSize: 13 }
        : nodeCount <= 5
        ? { fontSize: 30, padV: 14, padH: 30, gap: 22, arrowLen: 44, minW: 220, maxW: 700, arrowSize: 12 }
        : { fontSize: 24, padV: 10, padH: 22, gap: 16, arrowLen: 32, minW: 170, maxW: 650, arrowSize: 10 };

    const getNodeAnim = (i: number) => {
        const appearFrame = delay + (i * nodeDelay);
        const localFrame = frame - appearFrame;
        if (localFrame < 0) return { opacity: 0, transform: 'scale(0.8)' };
        const s = spring({ fps, frame: localFrame, config: springCfg });

        switch (enterType) {
            case 'pop':
                return { opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.5, 1])})` };
            case 'slide-up':
                return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)` };
            case 'slide-down':
                return { opacity: s, transform: `translateY(${interpolate(s, [0, 1], [-30, 0])}px)` };
            case 'fade-in':
                return { opacity: interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' }), transform: 'none' };
            default:
                return { opacity: s, transform: `scale(${interpolate(s, [0, 1], [0.8, 1])})` };
        }
    };

    const getEdgeAnim = (i: number) => {
        const appearFrame = delay + (i * nodeDelay) + 8;
        const s = frame - appearFrame < 0 ? 0 : spring({ fps, frame: frame - appearFrame });
        return { opacity: s };
    };

    const ns = layer.nodeStyle;
    const es = layer.edgeStyle;

    return (
        <div style={{
            ...posStyle,
            display: 'flex',
            flexDirection: isLR ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: `${sizing.gap}px`,
        }}>
            {layer.nodes.map((node, i) => {
                const anim = getNodeAnim(i);
                const edgeAnim = getEdgeAnim(i);
                const edge = i > 0 ? layer.edges?.find(e => e.to === node.id && e.from === layer.nodes[i - 1].id) : null;

                return (
                    <React.Fragment key={node.id}>
                        {i > 0 && (
                            <div style={{
                                opacity: edgeAnim.opacity,
                                display: 'flex',
                                flexDirection: isLR ? 'row' : 'column',
                                alignItems: 'center',
                                flexShrink: 0,
                                position: 'relative',
                            }}>
                                {edge?.label && (
                                    <div style={{
                                        position: 'absolute',
                                        top: isLR ? `-${sizing.fontSize + 4}px` : 'auto',
                                        left: isLR ? 'auto' : `${sizing.arrowLen + 6}px`,
                                        color: '#A1A1A6',
                                        fontSize: `${Math.max(11, sizing.fontSize - 8)}px`,
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        textTransform: 'uppercase',
                                    }}>
                                        {edge.label}
                                    </div>
                                )}
                                <div style={{
                                    width: isLR ? sizing.arrowLen : 3,
                                    height: isLR ? 3 : sizing.arrowLen,
                                    backgroundColor: es.color,
                                    borderRadius: 2,
                                    ...(es.style === 'dashed' ? { borderTop: `3px dashed ${es.color}`, backgroundColor: 'transparent' } : {}),
                                    ...(es.style === 'glow' ? { boxShadow: `0 0 8px ${es.color}60` } : {}),
                                }} />
                                <div style={{
                                    width: 0, height: 0,
                                    borderTop: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
                                    borderBottom: isLR ? `${sizing.arrowSize}px solid transparent` : 'none',
                                    borderLeft: isLR ? `${sizing.arrowSize + 4}px solid ${es.color}` : `${sizing.arrowSize}px solid transparent`,
                                    borderRight: isLR ? 'none' : `${sizing.arrowSize}px solid transparent`,
                                    borderTopColor: isLR ? 'transparent' : es.color,
                                    ...(es.style === 'glow' ? { filter: `drop-shadow(0 0 6px ${es.color}60)` } : {}),
                                }} />
                            </div>
                        )}
                        <div style={{
                            ...anim,
                            padding: `${sizing.padV}px ${sizing.padH}px`,
                            background: ns.fill || 'transparent',
                            border: ns.border ? `3px solid ${ns.border}` : 'none',
                            borderRadius: ns.borderRadius ?? 16,
                            color: ns.color,
                            fontSize: ns.fontSize ?? sizing.fontSize,
                            fontWeight: 700,
                            boxShadow: ns.glow || 'none',
                            textAlign: 'center' as const,
                            minWidth: sizing.minW,
                            maxWidth: sizing.maxW,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: `${sizing.padH * 0.5}px`,
                        }}>
                            {node.iconName && layer.iconDomain && (
                                <Img
                                    src={staticFile(`icons/${layer.iconDomain}/${node.iconName.toLowerCase().replace(/[-\s]+/g, '_')}.svg`)}
                                    style={{ height: Math.max(28, (ns.fontSize ?? sizing.fontSize) * 1.5), width: 'auto', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            <span>{node.label}</span>
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
