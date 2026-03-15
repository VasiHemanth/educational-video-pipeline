/**
 * WipeTransition — Cinematic bar wipe between scenes.
 *
 * Renders a colored bar that sweeps from left to right (or flash/scale)
 * in the last 12 frames of a scene. Used by EducationalReel to add
 * cinematic transitions without hard cuts.
 */

import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

interface WipeTransitionProps {
  style?: 'wipe_right' | 'scale_smash' | 'flash';
  color?: string;
  durationFrames?: number; // default 12
}

export const WipeTransition: React.FC<WipeTransitionProps> = ({
  style = 'wipe_right',
  color = '#00D4FF',
  durationFrames = 12,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Trigger in the last `durationFrames` frames of the scene
  const triggerFrame = durationInFrames - durationFrames;
  const localFrame = frame - triggerFrame;

  if (localFrame < 0) return null;

  const progress = interpolate(
    localFrame,
    [0, durationFrames],
    [0, 1],
    { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) }
  );

  if (style === 'flash') {
    // Quick white flash
    const flashOpacity = interpolate(
      localFrame,
      [0, 3, 6, durationFrames],
      [0, 0.9, 0.6, 0],
      { extrapolateRight: 'clamp' }
    );
    return (
      <AbsoluteFill
        style={{
          backgroundColor: 'white',
          opacity: flashOpacity,
          zIndex: 100,
        }}
      />
    );
  }

  if (style === 'scale_smash') {
    // The scene "pushes" toward viewer (subtle scale increase)
    // Scale effect is applied by the parent SceneWrapper via CSS transform
    return null;
  }

  // Default: wipe_right — colored bar sweeps L→R
  const barWidth = interpolate(progress, [0, 0.5, 1], [0, 100, 100], {
    extrapolateRight: 'clamp',
  });
  const barOffset = interpolate(progress, [0, 0.5, 1], [0, 0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ zIndex: 100, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: `${barOffset}%`,
          width: `${barWidth}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}00, ${color}FF, ${color}00)`,
          opacity: 0.8,
        }}
      />
    </AbsoluteFill>
  );
};

export default WipeTransition;
