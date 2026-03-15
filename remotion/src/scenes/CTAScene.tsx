/**
 * CTAScene — Identity close + subscribe pill
 * "You now understand X. Follow for more."
 * Uses MoodBackground for atmospheric lighting.
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, FONTS, LAYOUT, getMoodColor, EFFECTS } from '../design/theme';
import { SPRING_PRESETS } from '../animations/presets';
import { VideoScene } from '../EducationalTypes';

interface CTASceneProps {
  scene: VideoScene;
  watermark?: string;
  watermarkSub?: string;
}

export const CTAScene: React.FC<CTASceneProps> = ({
  scene,
  watermark = 'Cloud Architect',
  watermarkSub,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || COLORS.neonPurple;
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);

  // Entry
  const entrySpring = spring({ fps, frame, config: SPRING_PRESETS.gentle });

  // CTA pill spring
  const pillSpring = spring({
    fps,
    frame: Math.max(0, frame - 20),
    config: { damping: 12, mass: 0.6, stiffness: 180 },
  });
  const pillScale = interpolate(pillSpring, [0, 1], [0.6, 1]);
  const pillOpacity = pillSpring;

  // Pulsing subscribe glow
  const glowPulse = Math.sin(frame * 0.12) * 0.3 + 0.7;

  // Fade out
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: FONTS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        opacity: fadeOut,
      }}
    >
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.45} />

      {/* CTA Content */}
      <div
        style={{
          position: 'absolute',
          top: '28%',
          bottom: '28%',
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '40px',
          opacity: interpolate(entrySpring, [0, 1], [0, 1]),
          zIndex: 2,
        }}
      >
        {/* Main CTA text */}
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: '58px',
            fontWeight: 800,
            color: COLORS.textWhite,
            textAlign: 'center',
            lineHeight: 1.3,
            letterSpacing: '-1px',
            textShadow: EFFECTS.textShadow,
          }}
        >
          {scene.text}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: interpolate(frame, [15, 40], [0, 240], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.cubic),
            }),
            height: '4px',
            borderRadius: '2px',
            background: `linear-gradient(90deg, ${accent}, ${COLORS.neonCyan})`,
            boxShadow: EFFECTS.neonGlow(accent, 0.8),
          }}
        />

        {/* Subscribe Pill */}
        <div
          style={{
            transform: `scale(${pillScale})`,
            opacity: pillOpacity,
            padding: '18px 48px',
            borderRadius: '40px',
            background: `${accent}20`,
            border: `2px solid ${accent}`,
            boxShadow: EFFECTS.neonGlow(accent, glowPulse),
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{
            fontSize: '28px',
            fontWeight: 700,
            color: accent,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}>
            Follow + Save 🔖
          </span>
        </div>
      </div>

      {/* Branding (bottom) */}
      <div
        style={{
          position: 'absolute',
          bottom: LAYOUT.watermarkBottom,
          left: LAYOUT.watermarkLeft,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          opacity: interpolate(frame, [40, 60], [0, 0.7], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: COLORS.textMuted,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          {watermark}
        </div>
        {watermarkSub && (
          <div
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: COLORS.textMuted,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              opacity: 0.6,
            }}
          >
            {watermarkSub}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default CTAScene;
