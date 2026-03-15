/**
 * GlowBackground — Animated gradient orbs that pulse and drift
 *
 * Creates an Apple-event-style ambient glow effect behind content.
 * Extracted from the hardcoded glows in Intro.tsx to be reusable.
 */

import React from 'react';
import { useCurrentFrame } from 'remotion';
import { COLORS } from './theme';

interface GlowBackgroundProps {
  /** Primary accent color for the dominant orb */
  accent?: string;
  /** Secondary accent for the secondary orb */
  accent2?: string;
  /** Overall intensity (0-1) */
  intensity?: number;
}

export const GlowBackground: React.FC<GlowBackgroundProps> = ({
  accent = COLORS.neonPurple,
  accent2 = COLORS.neonCyan,
  intensity = 1.0,
}) => {
  const frame = useCurrentFrame();

  // Gentle sine wave for pulsing (natural breathing feel)
  const pulse = Math.sin(frame / 18) * 0.3 + 0.7;
  // Slow drift offset
  const driftX = Math.sin(frame / 50) * 20;
  const driftY = Math.cos(frame / 40) * 15;

  return (
    <>
      {/* Top-left orb */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '-10%',
          width: '800px',
          height: '800px',
          background: `radial-gradient(circle, ${accent}20, transparent 60%)`,
          opacity: pulse * intensity,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          transform: `translate(${driftX}px, ${driftY}px)`,
        }}
      />
      {/* Bottom-right orb */}
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-10%',
          width: '800px',
          height: '800px',
          background: `radial-gradient(circle, ${accent2}20, transparent 60%)`,
          opacity: pulse * 0.9 * intensity,
          filter: 'blur(100px)',
          pointerEvents: 'none',
          transform: `translate(${-driftX}px, ${-driftY}px)`,
        }}
      />
      {/* Center subtle orb */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: `translateX(-50%) translate(${driftY}px, ${driftX * 0.5}px)`,
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${COLORS.neonOrange}15, transparent 60%)`,
          opacity: pulse * 0.6 * intensity,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

export default GlowBackground;
