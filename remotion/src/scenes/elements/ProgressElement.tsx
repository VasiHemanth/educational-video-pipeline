import React from 'react';
import { ProgressLayer } from '../types';
import { resolvePosition } from '../animations';

export const ProgressElement: React.FC<{ layer: ProgressLayer; sceneDuration: number; globalProgress: number }> = ({ layer, sceneDuration, globalProgress }) => {
    const posStyle = resolvePosition(layer.position);

    return (
        <div style={{
            ...posStyle,
            width: layer.size.width,
            height: layer.size.height,
            backgroundColor: layer.style.trackColor,
            overflow: 'hidden',
        }}>
            <div style={{
                width: `${globalProgress}%`,
                height: '100%',
                backgroundColor: layer.style.fillColor,
                boxShadow: layer.style.glow ? `0 0 20px ${layer.style.fillColor}` : 'none',
                transition: 'width 0.1s linear',
            }} />
        </div>
    );
};
