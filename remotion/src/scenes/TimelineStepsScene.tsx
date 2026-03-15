import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { TimelineStepsData, VideoScene } from '../EducationalTypes';
import { WipeTransition } from '../animations/WipeTransition';
import { MoodBackground } from '../design/MoodBackground';
import {
  ACCENT_CYCLE,
  COLORS,
  EFFECTS,
  FONTS,
  getMoodColor,
} from '../design/theme';

interface TimelineStepsSceneProps {
  scene: VideoScene;
  sceneIndex?: number;
}

const STEP_POSITIONS = [0.12, 0.34, 0.56, 0.78];

export const TimelineStepsScene: React.FC<TimelineStepsSceneProps> = ({
  scene,
  sceneIndex = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || ACCENT_CYCLE[sceneIndex % ACCENT_CYCLE.length];
  const moodColor = getMoodColor('timeline_steps', scene.moodColor);
  const data = scene.visualData as TimelineStepsData | null;
  const steps = data?.steps?.slice(0, 4) || [];

  const entrySpring = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 120, mass: 0.88 },
  });
  const titleY = interpolate(entrySpring, [0, 1], [40, 0]);
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulseTravel = (Math.max(0, frame - 18) % 42) / 42;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: fadeOut }}>
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.5} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '176px 72px 70px',
          display: 'flex',
          flexDirection: 'column',
          gap: '26px',
          zIndex: 2,
        }}
      >
        <div
          style={{
            transform: `translateY(${titleY}px)`,
            opacity: entrySpring,
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxWidth: '520px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              padding: '10px 18px',
              borderRadius: '999px',
              border: `1px solid ${accent}38`,
              background: `rgba(255,255,255,0.07)`,
              color: accent,
              fontSize: '14px',
              fontWeight: 800,
              letterSpacing: '2.6px',
              textTransform: 'uppercase',
            }}
          >
            Execution Path
          </div>

          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: '60px',
              fontWeight: 800,
              lineHeight: 0.96,
              letterSpacing: '-1.6px',
              color: COLORS.textWhite,
              textTransform: 'uppercase',
              textShadow: EFFECTS.textShadow,
            }}
          >
            {scene.title}
          </div>

          <div
            style={{
              color: COLORS.textMuted,
              fontSize: '22px',
              lineHeight: 1.45,
              maxWidth: '460px',
            }}
          >
            {scene.text}
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.08)',
            background:
              'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.025) 100%)',
            boxShadow: EFFECTS.panelShadow,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: [
                'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 44px)',
                'repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 44px)',
              ].join(', '),
              opacity: 0.22,
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: 48,
              bottom: 48,
              left: '50%',
              width: '6px',
              transform: 'translateX(-50%)',
              borderRadius: '999px',
              background: `linear-gradient(180deg, rgba(255,255,255,0.08) 0%, ${accent}44 18%, ${accent} 48%, ${accent}44 82%, rgba(255,255,255,0.08) 100%)`,
              boxShadow: EFFECTS.neonGlow(accent, 0.45),
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: `calc(48px + (100% - 96px) * ${pulseTravel})`,
              left: '50%',
              width: '24px',
              height: '24px',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 24px ${accent}, 0 0 48px ${accent}66`,
            }}
          />

          {steps.map((step, index) => {
            const isLeft = index % 2 === 0;
            const delay = 12 + index * 9;
            const cardSpring = spring({
              fps,
              frame: Math.max(0, frame - delay),
              config: { damping: 16, stiffness: 155, mass: 0.82 },
            });
            const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
            const cardX = interpolate(cardSpring, [0, 1], [isLeft ? -60 : 60, 0]);
            const top = STEP_POSITIONS[index] || 0.78;

            return (
              <React.Fragment key={`${scene.id}-${step.n}-${step.title}`}>
                <div
                  style={{
                    position: 'absolute',
                    top: `${top * 100}%`,
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '74px',
                    height: '74px',
                    borderRadius: '24px',
                    background: `linear-gradient(145deg, ${accent}26 0%, rgba(255,255,255,0.08) 100%)`,
                    border: `1px solid ${accent}55`,
                    boxShadow: EFFECTS.neonGlow(accent, 0.4),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: COLORS.textWhite,
                    fontSize: '30px',
                    fontWeight: 800,
                    zIndex: 4,
                  }}
                >
                  {step.icon || step.n}
                </div>

                <div
                  style={{
                    position: 'absolute',
                    top: `${top * 100}%`,
                    [isLeft ? 'right' : 'left']: '50%',
                    width: '92px',
                    height: '2px',
                    background: `linear-gradient(90deg, ${isLeft ? accent : 'transparent'} 0%, ${
                      isLeft ? 'transparent' : accent
                    } 100%)`,
                    opacity: cardOpacity,
                    transform: `translateY(-50%) scaleX(${cardSpring})`,
                    transformOrigin: isLeft ? 'right center' : 'left center',
                    zIndex: 2,
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    top: `${top * 100}%`,
                    [isLeft ? 'left' : 'right']: '34px',
                    width: '380px',
                    transform: `translateY(-50%) translateX(${cardX}px)`,
                    opacity: cardOpacity,
                    borderRadius: '30px',
                    padding: '22px 24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background:
                      'linear-gradient(160deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
                    boxShadow: EFFECTS.panelShadow,
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      padding: '8px 12px',
                      borderRadius: '999px',
                      background: `rgba(255,255,255,0.06)`,
                      border: `1px solid ${accent}30`,
                      color: accent,
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '14px',
                    }}
                  >
                    Step {step.n}
                  </div>

                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: '34px',
                      fontWeight: 800,
                      lineHeight: 1.08,
                      marginBottom: '10px',
                    }}
                  >
                    {step.title}
                  </div>

                  <div
                    style={{
                      color: COLORS.textMuted,
                      fontSize: '21px',
                      lineHeight: 1.4,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <WipeTransition style="wipe_right" color={accent} durationFrames={12} />
    </AbsoluteFill>
  );
};

export default TimelineStepsScene;
