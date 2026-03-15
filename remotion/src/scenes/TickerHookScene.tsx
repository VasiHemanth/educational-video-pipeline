import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { VideoScene, TickerHookData } from '../EducationalTypes';
import { SPRING_PRESETS } from '../animations/presets';
import { WipeTransition } from '../animations/WipeTransition';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, EFFECTS, FONTS, getMoodColor } from '../design/theme';

interface TickerHookSceneProps {
  scene: VideoScene;
}

const trimChip = (text: string) => {
  const words = text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3);
  return words.join(' ');
};

export const TickerHookScene: React.FC<TickerHookSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || COLORS.neonCyan;
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);
  const data = scene.visualData as TickerHookData | null;

  const hookStyle = data?.hookStyle || 'question';
  const statText = data?.stat || '';
  const statLabel = data?.statLabel || '';
  const revealText = data?.reveal || 'How?';
  const questionText = data?.question || scene.text;
  const supportLine = scene.subtitle || statLabel || 'Live systems need readable decisions.';

  const entrySpring = spring({ fps, frame, config: SPRING_PRESETS.dramatic });
  const entryScale = interpolate(entrySpring, [0, 1], [0.88, 1]);
  const entryOpacity = interpolate(entrySpring, [0, 1], [0, 1]);
  const cardY = interpolate(entrySpring, [0, 1], [42, 0]);

  const revealDelay = 18;
  const revealSpring = spring({
    fps,
    frame: Math.max(0, frame - revealDelay),
    config: { damping: 12, mass: 0.7, stiffness: 180 },
  });

  const chromaOffset = interpolate(frame, [0, 6, 12], [8, 2, 0], {
    extrapolateRight: 'clamp',
  });

  const counterTarget = parseFloat(statText.replace(/[^0-9.]/g, '')) || 0;
  const counterSuffix = statText.replace(/[0-9.]/g, '');
  const counterProgress = interpolate(frame, [5, 28], [0, 1], {
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const counterValue = Math.round(counterTarget * counterProgress);

  const lineWidth = interpolate(frame, [16, 34], [0, 260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const fadeOut = interpolate(
    frame,
    [durationInFrames - 10, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );

  const chips = Array.from(
    new Set(
      [
        supportLine,
        revealText,
        ...(scene.keywords?.concepts || []),
        ...(scene.keywords?.tech_terms || []),
      ]
        .filter(Boolean)
        .map((text) => trimChip(text)),
    ),
  ).slice(0, 3);

  return (
    <AbsoluteFill style={{ overflow: 'hidden', opacity: fadeOut }}>
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.42} />

      <div
        style={{
          position: 'absolute',
          top: 112,
          left: 68,
          right: 68,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 3,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            padding: '10px 18px',
            borderRadius: '999px',
            border: `1px solid ${accent}3d`,
            background: 'rgba(255,255,255,0.06)',
            color: accent,
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '2.6px',
            textTransform: 'uppercase',
          }}
        >
          Hook
        </div>

        <div
          style={{
            color: COLORS.textMuted,
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {scene.title}
        </div>
      </div>

      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '188px 68px 96px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '920px',
            transform: `translateY(${cardY}px) scale(${entryScale})`,
            opacity: entryOpacity,
            borderRadius: '40px',
            border: '1px solid rgba(255,255,255,0.1)',
            background:
              'linear-gradient(165deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 100%)',
            boxShadow: EFFECTS.panelShadow,
            padding: '34px 40px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '22px',
            zIndex: 2,
            position: 'relative',
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
              opacity: 0.18,
            }}
          />

          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: '18px',
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  color: accent,
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '2.4px',
                  textTransform: 'uppercase',
                }}
              >
                {hookStyle === 'stat' ? 'Why the pattern works' : 'What you are about to learn'}
              </div>
              <div
                style={{
                  color: COLORS.textWhite,
                  fontSize: '26px',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  maxWidth: '620px',
                }}
              >
                {supportLine}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '210px',
                padding: '16px 18px',
                borderRadius: '22px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                boxShadow: EFFECTS.panelShadow,
              }}
            >
              <div
                style={{
                  color: COLORS.textMuted,
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                Read this as
              </div>
              <div
                style={{
                  color: COLORS.textWhite,
                  fontSize: '20px',
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                Signal to state to specialists to insight
              </div>
            </div>
          </div>

          {hookStyle === 'stat' ? (
            <div
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '18px',
                alignItems: 'end',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', height: '168px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      fontSize: '196px',
                      fontWeight: 900,
                      fontFamily: FONTS.display,
                      color: COLORS.neonMagenta,
                      opacity: 0.25,
                      transform: `translateX(${chromaOffset}px)`,
                      letterSpacing: '-6px',
                      lineHeight: 0.9,
                    }}
                  >
                    {counterValue}
                    {counterSuffix}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      fontSize: '196px',
                      fontWeight: 900,
                      fontFamily: FONTS.display,
                      color: accent,
                      opacity: 0.28,
                      transform: `translateX(-${chromaOffset}px)`,
                      letterSpacing: '-6px',
                      lineHeight: 0.9,
                    }}
                  >
                    {counterValue}
                    {counterSuffix}
                  </div>
                  <div
                    style={{
                      position: 'relative',
                      fontSize: '196px',
                      fontWeight: 900,
                      fontFamily: FONTS.display,
                      color: COLORS.textWhite,
                      letterSpacing: '-6px',
                      lineHeight: 0.9,
                      textShadow: EFFECTS.textShadow,
                    }}
                  >
                    {counterValue}
                    {counterSuffix}
                  </div>
                </div>

                <div
                  style={{
                    color: COLORS.textMuted,
                    fontSize: '34px',
                    fontWeight: 700,
                    letterSpacing: '1.6px',
                    textTransform: 'uppercase',
                  }}
                >
                  {statLabel}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '14px',
                  paddingBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: `${lineWidth}px`,
                    height: '4px',
                    borderRadius: '999px',
                    background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                    boxShadow: EFFECTS.neonGlow(accent, 0.7),
                  }}
                />
                <div
                  style={{
                    fontSize: '88px',
                    fontWeight: 900,
                    fontFamily: FONTS.display,
                    color: accent,
                    letterSpacing: '-2px',
                    textAlign: 'right',
                    transform: `scale(${interpolate(revealSpring, [0, 1], [1.16, 1])})`,
                    opacity: revealSpring,
                    textShadow: EFFECTS.neonGlow(accent, 0.9),
                  }}
                >
                  {revealText}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              <div
                style={{
                  fontSize: '82px',
                  fontWeight: 900,
                  fontFamily: FONTS.display,
                  color: COLORS.textWhite,
                  lineHeight: 0.96,
                  letterSpacing: '-2.6px',
                  textShadow: EFFECTS.textShadow,
                }}
              >
                {questionText}
              </div>

              <div
                style={{
                  width: `${lineWidth}px`,
                  height: '4px',
                  borderRadius: '999px',
                  background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                  boxShadow: EFFECTS.neonGlow(accent, 0.7),
                }}
              />

              <div
                style={{
                  fontSize: '72px',
                  fontWeight: 900,
                  fontFamily: FONTS.display,
                  color: accent,
                  letterSpacing: '-2px',
                  transform: `scale(${interpolate(revealSpring, [0, 1], [1.12, 1])})`,
                  opacity: revealSpring,
                }}
              >
                {revealText}
              </div>
            </div>
          )}

          <div
            style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(240px, 0.8fr)',
              gap: '18px',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                padding: '18px 20px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                boxShadow: EFFECTS.panelShadow,
                color: COLORS.textMuted,
                fontSize: '21px',
                fontWeight: 600,
                lineHeight: 1.35,
              }}
            >
              {scene.text}
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '18px 20px',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                boxShadow: EFFECTS.panelShadow,
              }}
            >
              <div
                style={{
                  color: COLORS.textMuted,
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                What matters
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {chips.map((chip) => (
                  <div
                    key={`${scene.id}-${chip}`}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '999px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      background: 'rgba(255,255,255,0.05)',
                      color: chip === trimChip(revealText) ? accent : COLORS.textWhite,
                      fontSize: '14px',
                      fontWeight: 800,
                      letterSpacing: '1.4px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {chip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <WipeTransition style="wipe_right" color={accent} durationFrames={12} />
    </AbsoluteFill>
  );
};

export default TickerHookScene;
