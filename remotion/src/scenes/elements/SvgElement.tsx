import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { SvgLayer } from '../types';
import { computeAnimation, resolvePosition } from '../animations';

export const SvgElement: React.FC<{ layer: SvgLayer; sceneDuration: number }> = ({ layer, sceneDuration }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const posStyle = resolvePosition(layer.position);
    const enterStyle = computeAnimation(layer.enter, frame, fps, sceneDuration, 'enter');
    const exitStyle = computeAnimation(layer.exit, frame, fps, sceneDuration, 'exit');

    return (
        <div style={{
            ...posStyle,
            width: layer.size.width,
            height: layer.size.height,
            opacity: layer.style?.opacity ?? 1,
            filter: layer.style?.filter,
            ...enterStyle,
            ...exitStyle,
        }} dangerouslySetInnerHTML={{ __html: layer.svg }} />
    );
};
