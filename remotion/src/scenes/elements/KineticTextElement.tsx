import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticTextLayer } from '../types';
import { computeAnimation, resolvePosition } from '../animations';

export const KineticTextElement: React.FC<{ layer: KineticTextLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const exitStyle = computeAnimation(layer.exit, frame, fps, sceneDuration, 'exit');

    const enterType = layer.enter?.type ?? 'fade-in';
    const delay = layer.enter?.delay ?? 0;
    const charDelay = layer.enter?.charDelay ?? 2;
    const springCfg = layer.enter?.spring ?? { damping: 60, stiffness: 100 };
    const localFrame = frame - delay;

    const highlightMap = new Map<string, string>();
    layer.highlightWords?.forEach(hw => highlightMap.set(hw.word.toLowerCase(), hw.color));

    const renderContent = () => {
        const text = layer.content;

        if (enterType === 'stagger-chars') {
            return (
                <span>
                    {text.split('').map((char, i) => {
                        const charFrame = localFrame - (i * charDelay);
                        const s = charFrame < 0 ? 0 : spring({ fps, frame: charFrame, config: springCfg });
                        return (
                            <span key={i} style={{
                                display: 'inline-block',
                                opacity: s,
                                transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)`,
                            }}>
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        );
                    })}
                </span>
            );
        }

        if (enterType === 'typewriter') {
            const charsVisible = Math.max(0, Math.min(text.length, Math.floor((localFrame) / charDelay)));
            const cursorBlink = frame % 20 < 10;
            return (
                <span>
                    {text.slice(0, charsVisible)}
                    <span style={{ opacity: cursorBlink ? 1 : 0, color: layer.style.color }}>|</span>
                </span>
            );
        }

        // Word-level highlighting with standard enter animation
        const words = text.split(' ');
        return (
            <span style={computeAnimation(layer.enter, frame, fps, sceneDuration, 'enter')}>
                {words.map((word, i) => {
                    const cleanWord = word.replace(/[.,;:!?'"()]/g, '').toLowerCase();
                    const highlight = highlightMap.get(cleanWord);
                    return (
                        <span key={i} style={{
                            color: highlight || layer.style.color,
                            fontWeight: highlight ? (layer.style.fontWeight ?? 700) : layer.style.fontWeight,
                        }}>
                            {word}{' '}
                        </span>
                    );
                })}
            </span>
        );
    };

    return (
        <div style={{
            ...posStyle,
            fontSize: layer.style.fontSize,
            fontWeight: layer.style.fontWeight ?? 700,
            color: layer.style.color,
            fontFamily: layer.style.fontFamily,
            letterSpacing: layer.style.letterSpacing ? `${layer.style.letterSpacing}px` : undefined,
            textTransform: layer.style.textTransform as any,
            textAlign: layer.style.textAlign ?? 'center',
            lineHeight: layer.style.lineHeight ?? 1.2,
            textShadow: layer.style.textShadow,
            maxWidth: layer.style.maxWidth,
            wordBreak: 'break-word',
            ...exitStyle,
        }}>
            {renderContent()}
        </div>
    );
};
