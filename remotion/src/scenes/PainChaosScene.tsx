import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { ChaosGridData, VideoScene } from '../EducationalTypes';
import { WipeTransition } from '../animations/WipeTransition';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, EFFECTS, FONTS, getMoodColor } from '../design/theme';

interface PainChaosSceneProps {
  scene: VideoScene;
}

export const PainChaosScene: React.FC<PainChaosSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = COLORS.neonMagenta;
  const moodColor = getMoodColor('pain_chaos', scene.moodColor);
  const data = scene.visualData as ChaosGridData | null;
  const problems = data?.problems || ['Manual steps', 'No rollback', 'Single failure point'];
  const tagline = data?.tagline || scene.text || 'The system feels brittle before it feels broken.';

  const entrySpring = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 120, mass: 0.9 },
  });
  const leftX = interpolate(entrySpring, [0, 1], [-40, 0]);
  const rightX = interpolate(entrySpring, [0, 1], [54, 0]);
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const pulseScale = 1 + (Math.sin(frame * 0.08) * 0.5 + 0.5) * 0.1;

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: fadeOut }}>
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.48} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: '176px 72px 70px',
          display: 'grid',
          gridTemplateColumns: '312px 1fr',
          gap: '34px',
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transform: `translateX(${leftX}px)`,
            opacity: entrySpring,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: '10px 18px',
                borderRadius: '999px',
                border: `1px solid rgba(255,107,120,0.28)`,
                background: 'rgba(255,107,120,0.14)',
                color: accent,
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '2.6px',
                textTransform: 'uppercase',
              }}
            >
              Friction Layer
            </div>

            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: '62px',
                fontWeight: 800,
                lineHeight: 0.96,
                letterSpacing: '-1.5px',
                textTransform: 'uppercase',
                color: COLORS.textWhite,
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
                maxWidth: '280px',
              }}
            >
              {scene.text}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '18px 20px',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'linear-gradient(165deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
              boxShadow: EFFECTS.panelShadow,
            }}
          >
            <div
              style={{
                color: accent,
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              Failure Signal
            </div>
            <div
              style={{
                color: COLORS.textWhite,
                fontSize: '28px',
                fontWeight: 700,
                lineHeight: 1.25,
              }}
            >
              Weak feedback loops make every handoff feel risky.
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            transform: `translateX(${rightX}px)`,
            opacity: entrySpring,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '38px',
              border: '1px solid rgba(255,255,255,0.08)',
              background:
                'linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.025) 100%)',
              boxShadow: EFFECTS.panelShadow,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: [
                  'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 46px)',
                  'repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 46px)',
                ].join(', '),
                opacity: 0.25,
              }}
            />

            <div
              style={{
                position: 'absolute',
                right: 86,
                top: 92,
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '1px solid rgba(255,107,120,0.22)',
                boxShadow: `0 0 80px rgba(255,107,120,0.12)`,
                transform: `scale(${pulseScale})`,
              }}
            />

            <div
              style={{
                position: 'absolute',
                right: 118,
                top: 124,
                width: '136px',
                height: '136px',
                borderRadius: '50%',
                background: 'rgba(255,107,120,0.08)',
                border: '1px solid rgba(255,107,120,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                fontFamily: FONTS.display,
                fontSize: '78px',
                fontWeight: 800,
                textShadow: EFFECTS.neonGlow(accent, 0.6),
              }}
            >
              ?
            </div>

            <div
              style={{
                position: 'absolute',
                inset: '42px 34px 118px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '18px',
              }}
            >
              {problems.slice(0, 4).map((problem, index) => {
                const delay = 10 + index * 7;
                const cardSpring = spring({
                  fps,
                  frame: Math.max(0, frame - delay),
                  config: { damping: 15, stiffness: 160, mass: 0.82 },
                });
                const rotate = index % 2 === 0 ? -2.8 : 2.8;
                const translateY = interpolate(cardSpring, [0, 1], [38, 0]);
                const glow = interpolate(frame - delay, [0, 8, 18], [0.85, 0.5, 0.24], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                });

                return (
                  <div
                    key={`${scene.id}-${problem}`}
                    style={{
                      transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
                      opacity: cardSpring,
                      borderRadius: '28px',
                      padding: '22px 22px 20px',
                      border: `1px solid rgba(255,107,120,${0.16 + glow * 0.2})`,
                      background:
                        'linear-gradient(155deg, rgba(255,107,120,0.15) 0%, rgba(255,255,255,0.03) 100%)',
                      boxShadow: `0 0 ${28 * glow}px rgba(255,107,120,0.14), ${EFFECTS.panelShadow}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '18px',
                      minHeight: '178px',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '16px',
                        background: 'rgba(255,107,120,0.16)',
                        border: '1px solid rgba(255,107,120,0.28)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accent,
                        fontSize: '28px',
                        boxShadow: EFFECTS.neonGlow(accent, 0.32),
                      }}
                    >
                      ✕
                    </div>

                    <div
                      style={{
                        color: COLORS.textWhite,
                        fontSize: '30px',
                        fontWeight: 700,
                        lineHeight: 1.1,
                      }}
                    >
                      {problem}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                position: 'absolute',
                left: 34,
                right: 34,
                bottom: 34,
                padding: '18px 20px',
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: COLORS.textMuted,
                fontSize: '24px',
                fontStyle: 'italic',
                lineHeight: 1.35,
              }}
            >
              {tagline}
            </div>
          </div>
        </div>
      </div>

      <WipeTransition style="flash" color={accent} durationFrames={8} />
    </AbsoluteFill>
  );
};

export default PainChaosScene;
