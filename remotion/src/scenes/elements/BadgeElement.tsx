import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { BadgeLayer } from '../types';
import { computeAnimation, resolvePosition } from '../animations';

export const BadgeElement: React.FC<{ layer: BadgeLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const enterStyle = computeAnimation(layer.enter, frame, fps, sceneDuration, 'enter');

    return (
        <div style={{
            ...posStyle,
            fontSize: layer.style.fontSize,
            color: layer.style.color,
            background: layer.style.background || 'transparent',
            border: layer.style.borderColor ? `2px solid ${layer.style.borderColor}` : 'none',
            borderRadius: layer.style.borderRadius ?? 8,
            padding: layer.style.padding ?? '8px 16px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            display: 'inline-block',
            ...enterStyle,
        }}>
            {layer.content}
        </div>
    );
};
