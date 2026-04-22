import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { TextLayer } from '../types';
import { computeAnimation, computeLoop, resolvePosition } from '../animations';

export const TextElement: React.FC<{ layer: TextLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const enterStyle = computeAnimation(layer.enter, frame, fps, sceneDuration, 'enter');
    const exitStyle = computeAnimation(layer.exit, frame, fps, sceneDuration, 'exit');
    const loopStyle = computeLoop(layer.loop, frame);

    return (
        <div style={{
            ...posStyle,
            fontSize: layer.style.fontSize,
            fontWeight: layer.style.fontWeight ?? 400,
            color: layer.style.color,
            fontFamily: layer.style.fontFamily,
            letterSpacing: layer.style.letterSpacing ? `${layer.style.letterSpacing}px` : undefined,
            textTransform: layer.style.textTransform as any,
            textAlign: layer.style.textAlign ?? 'center',
            lineHeight: layer.style.lineHeight ?? 1.3,
            textShadow: layer.style.textShadow,
            maxWidth: layer.style.maxWidth,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            ...enterStyle,
            ...exitStyle,
            ...loopStyle,
        }}>
            {layer.content}
        </div>
    );
};
