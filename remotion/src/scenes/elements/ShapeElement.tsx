import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ShapeLayer } from '../types';
import { computeAnimation, computeLoop, resolvePosition } from '../animations';

export const ShapeElement: React.FC<{ layer: ShapeLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const enterStyle = computeAnimation(layer.enter, frame, fps, sceneDuration, 'enter');
    const exitStyle = computeAnimation(layer.exit, frame, fps, sceneDuration, 'exit');
    const loopStyle = computeLoop(layer.loop, frame);

    const baseStyle: React.CSSProperties = {
        ...posStyle,
        width: layer.size.width,
        height: layer.size.height,
        background: layer.style.gradient || layer.style.fill || 'transparent',
        border: layer.style.stroke ? `${layer.style.strokeWidth ?? 2}px solid ${layer.style.stroke}` : 'none',
        borderRadius: layer.shape === 'circle' ? '50%' : (layer.style.borderRadius ?? 0),
        opacity: layer.style.opacity ?? 1,
        filter: layer.style.blur ? `blur(${layer.style.blur}px)` : undefined,
        pointerEvents: 'none',
        ...enterStyle,
        ...exitStyle,
        ...loopStyle,
    };

    if (layer.shape === 'line') {
        return (
            <div style={{
                ...posStyle,
                width: layer.size.width,
                height: layer.style.strokeWidth ?? 2,
                backgroundColor: layer.style.stroke || layer.style.fill || '#333',
                ...enterStyle,
                ...exitStyle,
                ...loopStyle,
            }} />
        );
    }

    return <div style={baseStyle} />;
};
