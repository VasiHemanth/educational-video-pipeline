import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface MoodBackgroundProps {
  moodColor?: string;
  accentColor?: string;
  spotlightY?: number;
  speed?: number;
}

const hexToRgb = (color: string) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

export const MoodBackground: React.FC<MoodBackgroundProps> = ({
  moodColor = '#07111c',
  accentColor = '#61e4ff',
  spotlightY = 0.45,
  speed = 0.5,
}) => {
  const frame = useCurrentFrame();
  const accentRgb = hexToRgb(accentColor);

  const opacity = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulse = Math.sin(frame * speed * 0.035) * 0.08 + 1;
  const spotlightSize = Math.round(760 * pulse);
  const spotX = 47 + Math.sin(frame * 0.011) * 7;
  const spotY = Math.round(spotlightY * 100);
  const haloX = 82 + Math.cos(frame * 0.009) * 5;
  const beamOffset = (frame * speed * 0.75) % 180;
  const gridOffsetX = (frame * speed * 0.18) % 56;
  const gridOffsetY = (frame * speed * 0.32) % 56;

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${moodColor} 0%, #050a12 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage: [
            `radial-gradient(circle ${spotlightSize}px at ${spotX}% ${spotY}%, rgba(${accentRgb}, 0.16) 0%, transparent 66%)`,
            `radial-gradient(circle 520px at ${haloX}% 82%, rgba(${accentRgb}, 0.08) 0%, transparent 70%)`,
            'linear-gradient(140deg, rgba(255,255,255,0.03) 0%, transparent 40%)',
          ].join(', '),
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage: [
            'repeating-linear-gradient(90deg, rgba(128,154,183,0.08) 0 1px, transparent 1px 56px)',
            'repeating-linear-gradient(180deg, rgba(128,154,183,0.06) 0 1px, transparent 1px 56px)',
          ].join(', '),
          backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
          opacity: 0.28,
        }}
      />

      <AbsoluteFill
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0.018) 0 2px, transparent 2px 24px)',
          transform: `translateX(${beamOffset - 90}px)`,
          opacity: 0.24,
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 18%, transparent 84%, rgba(0,0,0,0.28) 100%)',
        }}
      />

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 90% 88% at 50% 48%, transparent 48%, rgba(0, 0, 0, 0.82) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

export default MoodBackground;
