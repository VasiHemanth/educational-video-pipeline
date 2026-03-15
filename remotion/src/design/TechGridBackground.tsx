import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { COLORS } from './theme';

export const TechGridBackground: React.FC<{
  speed?: number; // Speed of the grid pan (pixels per frame)
}> = ({ speed = 1 }) => {
  const frame = useCurrentFrame();

  // Calculate pan offset to create an infinite scrolling effect
  // The background size is 100px, so we modulo it by 100 to loop seamlessly
  const offsetY = (frame * speed) % 100;
  const offsetX = (frame * (speed * 0.5)) % 100;

  // Slowly pulsating grid opacity for "breathing" effect
  const pulseOpacity = interpolate(
    Math.sin(frame / 30),
    [-1, 1],
    [0.02, 0.05]
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bgDark, overflow: 'hidden' }}>

      {/* ── Layer 1: The moving dot grid ── */}
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,${pulseOpacity}) 2px, transparent 2px)`,
          backgroundSize: '80px 80px',
          backgroundPosition: `${offsetX}px ${offsetY}px`,
        }}
      />

      {/* ── Layer 2: Subtle static grid lines to simulate architecture blueprints ── */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(to right, ${COLORS.gridLines} 1px, transparent 1px),
            linear-gradient(to bottom, ${COLORS.gridLines} 1px, transparent 1px)
          `,
          backgroundSize: '240px 240px',
          backgroundPosition: 'center center',
          opacity: 0.5,
        }}
      />

      {/* ── Layer 3: Heavy Dark Vignette to focus attention on the center ── */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at center 40%, transparent 20%, ${COLORS.bgDark} 90%)`,
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 4: Extremely subtle, slow-moving noise texture (from GrainOverlay) ── */}
      <svg viewBox="0 0 1080 1920" style={{ position: 'absolute', opacity: 0.03, mixBlendMode: 'overlay' }}>
        <filter id="noiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </AbsoluteFill>
  );
};
