import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Scene, Layer } from './types';
import { TextElement } from './elements/TextElement';
import { KineticTextElement } from './elements/KineticTextElement';
import { ListElement } from './elements/ListElement';
import { ShapeElement } from './elements/ShapeElement';
import { SvgElement } from './elements/SvgElement';
import { DiagramElement } from './elements/DiagramElement';
import { ProgressElement } from './elements/ProgressElement';
import { BadgeElement } from './elements/BadgeElement';

const renderLayer = (layer: Layer, sceneDuration: number, globalProgress: number) => {
    switch (layer.type) {
        case 'text':
            return <TextElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'kinetic-text':
            return <KineticTextElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'list':
            return <ListElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'shape':
            return <ShapeElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'svg':
            return <SvgElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'diagram':
            return <DiagramElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        case 'progress':
            return <ProgressElement key={layer.id} layer={layer} sceneDuration={sceneDuration} globalProgress={globalProgress} />;
        case 'badge':
            return <BadgeElement key={layer.id} layer={layer} sceneDuration={sceneDuration} />;
        default:
            return null;
    }
};

export const SceneRenderer: React.FC<{
    scene: Scene;
    globalProgress: number;
    fontFamily?: string;
}> = ({ scene, globalProgress, fontFamily }) => {
    const bg = scene.background;

    return (
        <AbsoluteFill style={{
            backgroundColor: bg.color,
            overflow: 'hidden',
            fontFamily: fontFamily || "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
        }}>
            {/* Background gradients */}
            {bg.gradients?.map((g, i) => {
                if (g.type === 'radial') {
                    return (
                        <div key={`bg-${i}`} style={{
                            position: 'absolute',
                            left: (g.position?.x ?? 540) - (g.size ?? 800) / 2,
                            top: (g.position?.y ?? 960) - (g.size ?? 800) / 2,
                            width: g.size ?? 800,
                            height: g.size ?? 800,
                            background: `radial-gradient(circle, ${g.colors.join(', ')})`,
                            filter: g.blur ? `blur(${g.blur}px)` : undefined,
                            pointerEvents: 'none',
                        }} />
                    );
                }
                // linear gradient
                return (
                    <div key={`bg-${i}`} style={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(${g.angle ?? 180}deg, ${g.colors.join(', ')})`,
                        pointerEvents: 'none',
                    }} />
                );
            })}

            {/* Layers — rendered in order (first = back, last = front) */}
            {scene.layers.map(layer => renderLayer(layer, scene.durationFrames, globalProgress))}
        </AbsoluteFill>
    );
};
