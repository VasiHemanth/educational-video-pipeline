/**
 * SceneTransition — Animated transition between scenes
 *
 * Renders at the END of a scene to transition to the next one.
 * Supports: fade, wipe, zoom
 */

import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { COLORS } from '../design/theme';

type TransitionType = 'fade' | 'wipe' | 'zoom' | 'none';

interface SceneTransitionProps {
  type?: TransitionType;
  /** Duration of the transition in frames */
  durationFrames?: number;
  /** Accent color for wipe transition edge */
  accent?: string;
}

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  type = 'fade',
  durationFrames = 15,
  accent = COLORS.neonCyan,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Transition only renders in the last `durationFrames` of the scene
  const transitionStart = durationInFrames - durationFrames;
  const progress = interpolate(
    frame,
    [transitionStart, durationInFrames],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  if (type === 'none' || progress <= 0) return null;

  if (type === 'fade') {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bg,
          opacity: progress,
          zIndex: 100,
        }}
      />
    );
  }

  if (type === 'wipe') {
    return (
      <>
        {/* Accent-colored leading edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: `${progress * 100 - 3}%`,
            width: '4%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            filter: `blur(8px)`,
            zIndex: 101,
            opacity: Math.min(1, progress * 3),
          }}
        />
        {/* Solid wipe */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: COLORS.bg,
            zIndex: 100,
          }}
        />
      </>
    );
  }

  if (type === 'zoom') {
    const scale = interpolate(progress, [0, 1], [1, 1.5]);
    const opacity = interpolate(progress, [0, 0.5, 1], [0, 0, 1]);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: COLORS.bg,
          opacity,
          transform: `scale(${scale})`,
          zIndex: 100,
        }}
      />
    );
  }

  return null;
};

export default SceneTransition;
