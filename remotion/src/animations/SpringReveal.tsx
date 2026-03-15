/**
 * SpringReveal — Wraps any child element with spring-physics animation
 *
 * Usage:
 *   <SpringReveal delay={30} preset="bouncy">
 *     <MyCard />
 *   </SpringReveal>
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_PRESETS, SpringPresetName } from './presets';

interface SpringRevealProps {
  children: React.ReactNode;
  /** Frame delay before this element starts animating */
  delay?: number;
  /** Spring physics preset name */
  preset?: SpringPresetName;
  /** Initial scale (0 = invisible, 0.6 = small, 1 = no scale) */
  fromScale?: number;
  /** Initial Y offset in pixels (positive = below) */
  fromY?: number;
  /** Initial X offset in pixels (positive = right) */
  fromX?: number;
  /** Initial opacity */
  fromOpacity?: number;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

export const SpringReveal: React.FC<SpringRevealProps> = ({
  children,
  delay = 0,
  preset = 'snappy',
  fromScale = 0.6,
  fromY = 30,
  fromX = 0,
  fromOpacity = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const springConfig = SPRING_PRESETS[preset];
  const progress = spring({
    fps,
    frame: frame - delay,
    config: springConfig,
  });

  const scale = interpolate(progress, [0, 1], [fromScale, 1]);
  const translateY = interpolate(progress, [0, 1], [fromY, 0]);
  const translateX = interpolate(progress, [0, 1], [fromX, 0]);
  const opacity = interpolate(progress, [0, 1], [fromOpacity, 1]);

  return (
    <div
      style={{
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
        opacity,
        willChange: 'transform, opacity',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default SpringReveal;
