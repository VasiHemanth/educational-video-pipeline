import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { ListLayer } from '../types';
import { resolvePosition, computeAnimation } from '../animations';

const BULLET_CHARS: Record<string, (i: number) => string> = {
    arrow: () => '\u25B8',
    dash: () => '\u2014',
    dot: () => '\u2022',
    number: (i) => `${i + 1}.`,
    none: () => '',
};

export const ListElement: React.FC<{ layer: ListLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const exitStyle = computeAnimation(layer.exit, frame, fps, sceneDuration, 'exit');
    const delay = layer.enter?.delay ?? 0;
    const itemDelay = layer.enter?.charDelay ?? 12; // frames between items
    const springCfg = layer.enter?.spring ?? { damping: 50, stiffness: 80 };
    const bulletFn = BULLET_CHARS[layer.bulletStyle ?? 'arrow'] ?? BULLET_CHARS.arrow;

    const highlightMap = new Map<string, string>();
    layer.highlightWords?.forEach(hw => highlightMap.set(hw.word.toLowerCase(), hw.color));

    return (
        <div style={{
            ...posStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: `${layer.itemSpacing ?? 12}px`,
            ...exitStyle,
        }}>
            {layer.items.map((item, i) => {
                const itemFrame = frame - delay - (i * itemDelay);
                const s = itemFrame < 0 ? 0 : spring({ fps, frame: itemFrame, config: springCfg });
                const y = interpolate(s, [0, 1], [20, 0]);

                const words = item.split(' ');

                return (
                    <div key={i} style={{
                        opacity: s,
                        transform: `translateY(${y}px)`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: layer.style.fontSize,
                        fontWeight: layer.style.fontWeight ?? 400,
                        color: layer.style.color,
                        fontFamily: layer.style.fontFamily,
                        lineHeight: layer.style.lineHeight ?? 1.5,
                    }}>
                        {layer.bulletStyle !== 'none' && (
                            <span style={{
                                color: layer.bulletColor ?? layer.style.color,
                                fontWeight: 700,
                                fontSize: layer.style.fontSize * 0.8,
                                flexShrink: 0,
                            }}>
                                {bulletFn(i)}
                            </span>
                        )}
                        <span>
                            {words.map((word, wi) => {
                                const clean = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
                                const hl = highlightMap.get(clean);
                                return (
                                    <span key={wi} style={{
                                        color: hl || layer.style.color,
                                        fontWeight: hl ? 700 : (layer.style.fontWeight ?? 400),
                                    }}>
                                        {word}{' '}
                                    </span>
                                );
                            })}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
