/**
 * SynthesisScene — "Putting it all together" finale
 * Uses MoodBackground for atmospheric lighting.
 */

import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { KineticText } from '../animations/KineticText';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, FONTS, LAYOUT, getMoodColor } from '../design/theme';
import { SPRING_PRESETS } from '../animations/presets';
import { VideoScene } from '../EducationalTypes';

interface SynthesisSceneProps {
  scene: VideoScene;
}

export const SynthesisScene: React.FC<SynthesisSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || COLORS.neonCyan;
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);

  const entrySpring = spring({ fps, frame, config: SPRING_PRESETS.gentle });
  const entryOpacity = interpolate(entrySpring, [0, 1], [0, 1]);

  const badgeSpring = spring({ fps, frame: frame - 10, config: SPRING_PRESETS.bouncy });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.5, 1]);
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 15, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: FONTS.primary,
        overflow: 'hidden',
        opacity: fadeOut * entryOpacity,
      }}
    >
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.4} />

      {/* Badge */}
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.safeTop + 20,
          left: '50%',
          transform: `translateX(-50%) scale(${badgeScale})`,
          opacity: badgeOpacity,
          padding: '10px 28px',
          borderRadius: '12px',
          backgroundColor: `${accent}18`,
          border: `2px solid ${accent}40`,
          zIndex: 2,
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: accent,
            letterSpacing: '3px',
            textTransform: 'uppercase',
          }}
        >
          ✦ COMBINED
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: LAYOUT.safeTop + 80,
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          textAlign: 'center',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: '52px',
            fontWeight: 800,
            color: COLORS.textWhite,
            letterSpacing: '-1px',
            lineHeight: 1.15,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          {scene.title}
        </div>
      </div>

      {/* Synthesis text */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          bottom: '20%',
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        <KineticText
          text={scene.text}
          keywords={scene.keywords}
          accent={accent}
          fontSize={40}
          align="center"
          startFrame={25}
          framesPerWord={5}
        />
      </div>
    </AbsoluteFill>
  );
};

export default SynthesisScene;
