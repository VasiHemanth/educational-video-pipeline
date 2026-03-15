/**
 * HookScene — The 0-4 second curiosity gap opener
 *
 * Makes viewers stop scrolling with large kinetic text.
 * Now uses MoodBackground for atmospheric lighting.
 */

import React from 'react';
import { AbsoluteFill, spring, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { KineticText } from '../animations/KineticText';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, LAYOUT, getMoodColor } from '../design/theme';
import { SPRING_PRESETS } from '../animations/presets';
import { VideoScene } from '../EducationalTypes';

interface HookSceneProps {
  scene: VideoScene;
}

export const HookScene: React.FC<HookSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || COLORS.neonCyan;
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);

  // Dramatic entry spring
  const entrySpring = spring({
    fps,
    frame,
    config: SPRING_PRESETS.dramatic,
  });
  const entryScale = interpolate(entrySpring, [0, 1], [1.3, 1]);
  const entryOpacity = interpolate(entrySpring, [0, 1], [0, 1]);

  // Subtle continuous pulse
  const pulse = Math.sin(frame / 12) * 0.02 + 1;

  // Fade out at end
  const fadeOut = interpolate(
    frame,
    [durationInFrames - 12, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        opacity: fadeOut,
      }}
    >
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.4} />

      {/* Hook text — centered, large */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          bottom: '25%',
          left: `${LAYOUT.paddingX}px`,
          right: `${LAYOUT.paddingX}px`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          transform: `scale(${entryScale * pulse})`,
          opacity: entryOpacity,
          zIndex: 2,
        }}
      >
        <KineticText
          text={scene.text}
          keywords={scene.keywords}
          accent={accent}
          fontSize={56}
          align="center"
          showBullets={false}
          framesPerWord={6}
        />
      </div>

      {/* Accent line */}
      <div
        style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: interpolate(frame, [20, 40], [0, 120], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.cubic),
          }),
          height: '3px',
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.7,
          zIndex: 2,
        }}
      />
    </AbsoluteFill>
  );
};

export default HookScene;
