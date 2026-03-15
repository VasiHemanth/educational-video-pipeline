import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { CardStack } from '../animations/CardStack';
import { DynamicDiagram } from '../animations/DynamicDiagram';
import { KineticText } from '../animations/KineticText';
import { SplitComparison } from '../animations/SplitComparison';
import {
  CardStackData,
  ComparisonData,
  DiagramData,
  SceneTiming,
  VideoScene,
} from '../EducationalTypes';
import { MoodBackground } from '../design/MoodBackground';
import {
  ACCENT_CYCLE,
  COLORS,
  EFFECTS,
  FONTS,
  FONT_SIZES,
  getMoodColor,
  LAYOUT,
} from '../design/theme';

interface ConceptSceneProps {
  scene: VideoScene;
  sceneIndex: number;
  timing?: SceneTiming;
  watermark?: string;
  watermarkSub?: string;
}

const VISUAL_LABELS: Record<string, string> = {
  diagram: 'Signal Map',
  split_compare: 'A/B Compare',
  card_stack: 'Stacked Proof',
  numbered_list: 'Sequence',
  text_only: 'Core Idea',
  code_block: 'Code View',
  metric_counter: 'Metric',
  icon_grid: 'Pattern Grid',
};

const splitDisplayBeats = (text: string): string[] => {
  const explicitLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (explicitLines.length > 1) {
    return explicitLines.slice(0, 4);
  }

  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return sentences.slice(0, 3);
  }

  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 7) {
    return [text.trim()];
  }

  const chunkCount = words.length > 22 ? 4 : words.length > 14 ? 3 : 2;
  const chunkSize = Math.ceil(words.length / chunkCount);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }

  return chunks.slice(0, 4);
};

const trimWords = (text: string, count: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= count) return text.trim();
  return `${words.slice(0, count).join(' ')}...`;
};

const getStageSummary = (scene: VideoScene) => {
  if (scene.subtitle) return scene.subtitle;
  const sentence = scene.text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .find(Boolean);
  return trimWords(sentence || scene.text, 12);
};

const collectKeywordChips = (scene: VideoScene): string[] => {
  const chips = [
    ...(scene.keywords.tech_terms || []),
    ...(scene.keywords.concepts || []),
    ...(scene.keywords.action_verbs || []),
  ];

  if (scene.visualFormat !== 'text_only') {
    chips.unshift(VISUAL_LABELS[scene.visualFormat] || scene.visualFormat);
  }

  return Array.from(new Set(chips)).slice(0, 5);
};

const sceneLabel = (scene: VideoScene, sceneIndex: number) => {
  if (scene.sceneType === 'concept') {
    return `Step ${String(sceneIndex + 1).padStart(2, '0')}`;
  }

  return scene.sceneType.replace(/_/g, ' ');
};

export const ConceptScene: React.FC<ConceptSceneProps> = ({
  scene,
  sceneIndex,
  timing,
  watermark = 'LEARN',
  watermarkSub,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  const accent = scene.accentColor || ACCENT_CYCLE[sceneIndex % ACCENT_CYCLE.length];
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);
  const hasVisual = scene.visualFormat !== 'text_only';
  const beats = splitDisplayBeats(scene.text);
  const chips = collectKeywordChips(scene);
  const stageSummary = getStageSummary(scene);
  const primaryChip =
    chips.find((chip) => chip !== (VISUAL_LABELS[scene.visualFormat] || scene.visualFormat)) ||
    'signal flow';
  const outcomeBeat = trimWords(beats[beats.length - 1] || scene.text, 8);

  const phaseText = timing?.phaseText ?? 56;
  const visualStartFrame = Math.max(16, Math.round(phaseText * 0.42));

  const fadeOut = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const progress = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const leftColumnSpring = spring({
    fps,
    frame,
    config: { damping: 16, stiffness: 115, mass: 0.9 },
  });
  const stageSpring = spring({
    fps,
    frame: Math.max(0, frame - 6),
    config: { damping: 14, stiffness: 130, mass: 0.9 },
  });

  const leftX = interpolate(leftColumnSpring, [0, 1], [-42, 0]);
  const stageX = interpolate(stageSpring, [0, 1], [60, 0]);
  const stageScale = interpolate(stageSpring, [0, 1], [0.96, 1]);
  const titleOpacity = interpolate(leftColumnSpring, [0, 0.6, 1], [0, 0.8, 1]);
  const stageGlow = 0.55 + (Math.sin((frame - visualStartFrame) * 0.085) * 0.5 + 0.5) * 0.45;

  const renderVisual = () => {
    switch (scene.visualFormat) {
      case 'split_compare':
        return (
          <SplitComparison
            data={scene.visualData as ComparisonData}
            startFrame={visualStartFrame}
          />
        );
      case 'card_stack':
        return (
          <CardStack
            data={scene.visualData as CardStackData}
            accent={accent}
            startFrame={visualStartFrame}
          />
        );
      case 'diagram':
        return (
          <DynamicDiagram
            data={scene.visualData as DiagramData}
            accent={accent}
            startFrame={visualStartFrame}
          />
        );
      case 'text_only':
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.textWhite,
        fontFamily: FONTS.primary,
        overflow: 'hidden',
        opacity: fadeOut,
      }}
    >
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.46} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          padding: `${LAYOUT.safeTop}px ${LAYOUT.paddingX}px ${LAYOUT.safeBottom}px`,
          display: 'grid',
          gridTemplateColumns: hasVisual ? '392px minmax(0, 1fr)' : '1fr',
          gap: '26px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minWidth: 0,
            transform: `translateX(${leftX}px)`,
            opacity: titleOpacity,
            zIndex: 2,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                padding: '10px 18px',
                borderRadius: '999px',
                border: `1px solid ${accent}40`,
                background: `linear-gradient(135deg, ${accent}22, rgba(255,255,255,0.04))`,
                color: accent,
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '2.8px',
                textTransform: 'uppercase',
                boxShadow: EFFECTS.neonGlow(accent, 0.45),
              }}
            >
              {sceneLabel(scene, sceneIndex)}
            </div>

            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: `${FONT_SIZES.title + 16}px`,
                fontWeight: 800,
                lineHeight: 0.96,
                letterSpacing: '-1.8px',
                textTransform: 'uppercase',
                textShadow: EFFECTS.textShadow,
              }}
            >
              {scene.title}
            </div>

            <div
              style={{
                maxWidth: '344px',
                color: COLORS.textMuted,
                fontSize: '21px',
                lineHeight: 1.45,
              }}
            >
              {stageSummary}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {beats.map((beat, index) => {
              const beatSpring = spring({
                fps,
                frame: Math.max(0, frame - 4 - index * 12),
                config: { damping: 15, stiffness: 125, mass: 0.8 },
              });
              const beatX = interpolate(beatSpring, [0, 1], [-28, 0]);
              const beatOpacity = interpolate(beatSpring, [0, 1], [0, 1]);

              return (
                <div
                  key={`${scene.id}-beat-${index}`}
                  style={{
                    transform: `translateX(${beatX}px)`,
                    opacity: beatOpacity,
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'stretch',
                    padding: index === 0 ? '18px 20px' : '14px 18px',
                    borderRadius: '24px',
                    border: `1px solid rgba(255,255,255,${index === 0 ? 0.12 : 0.08})`,
                    background:
                      index === 0
                        ? 'linear-gradient(160deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.03) 100%)'
                        : 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                    boxShadow: EFFECTS.panelShadow,
                  }}
                >
                  <div
                    style={{
                      width: index === 0 ? '6px' : '4px',
                      borderRadius: '999px',
                      background: `linear-gradient(180deg, ${accent} 0%, ${accent}33 100%)`,
                      boxShadow: EFFECTS.neonGlow(accent, index === 0 ? 0.45 : 0.25),
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <KineticText
                      text={beat}
                      keywords={scene.keywords}
                      accent={accent}
                      startFrame={4 + index * 12}
                      fontSize={index === 0 ? 31 : 23}
                      framesPerWord={index === 0 ? 6 : 5}
                      maxWidth={320}
                      revealMode="line"
                      showBullets={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chips.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {chips.map((chip, index) => {
                  const chipOpacity = interpolate(frame, [index * 5, index * 5 + 10], [0, 1], {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                  });

                  return (
                    <div
                      key={`${scene.id}-chip-${chip}`}
                      style={{
                        opacity: chipOpacity,
                        padding: '10px 14px',
                        borderRadius: '999px',
                        border: `1px solid rgba(255,255,255,0.1)`,
                        background: 'rgba(255,255,255,0.05)',
                        color: chip === (VISUAL_LABELS[scene.visualFormat] || scene.visualFormat) ? accent : COLORS.textWhite,
                        fontSize: '15px',
                        fontWeight: 700,
                        letterSpacing: '0.4px',
                      }}
                    >
                      {chip}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'column',
                alignSelf: 'flex-start',
                gap: '4px',
                padding: '16px 18px',
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: EFFECTS.panelShadow,
              }}
            >
              <div
                style={{
                  color: COLORS.textWhite,
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                }}
              >
                {watermark}
              </div>
              {watermarkSub ? (
                <div
                  style={{
                    color: COLORS.textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  {watermarkSub}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {hasVisual ? (
          <div
            style={{
              position: 'relative',
              transform: `translateX(${stageX}px) scale(${stageScale})`,
              opacity: interpolate(stageSpring, [0, 1], [0, 1]),
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                padding: '12px 16px',
                borderRadius: '18px',
                background: `linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.03))`,
                border: '1px solid rgba(255,255,255,0.12)',
                color: COLORS.textMuted,
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                boxShadow: EFFECTS.panelShadow,
              }}
            >
              {String(sceneIndex + 1).padStart(2, '0')} / {timing ? 'Live Sync' : 'Stage'}
            </div>

            <div
              style={{
                position: 'absolute',
                top: 22,
                left: 26,
                padding: '12px 16px',
                borderRadius: '18px',
                background: `rgba(255,255,255,0.06)`,
                border: '1px solid rgba(255,255,255,0.1)',
                color: accent,
                fontSize: '14px',
                fontWeight: 800,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                zIndex: 3,
                boxShadow: EFFECTS.neonGlow(accent, 0.3),
              }}
            >
              {VISUAL_LABELS[scene.visualFormat] || scene.visualFormat}
            </div>

            <div
              style={{
                position: 'absolute',
                inset: '54px 0 0 0',
                borderRadius: '38px',
                border: `1px solid rgba(255,255,255,0.1)`,
                background:
                  'linear-gradient(165deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0.02) 100%)',
                boxShadow: [
                  EFFECTS.panelShadow,
                  `0 0 ${42 * stageGlow}px rgba(97, 228, 255, ${0.08 * stageGlow})`,
                ].join(', '),
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: [
                    'repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 42px)',
                    'repeating-linear-gradient(180deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 42px)',
                  ].join(', '),
                  opacity: 0.35,
                }}
              />

              <div
                style={{
                  position: 'absolute',
                  top: 84,
                  left: 28,
                  right: 28,
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '16px',
                  alignItems: 'start',
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: '24px',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: EFFECTS.panelShadow,
                  }}
                >
                  <div
                    style={{
                      color: accent,
                      fontSize: '13px',
                      fontWeight: 800,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                    }}
                  >
                    What to track
                  </div>
                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: '23px',
                      fontWeight: 700,
                      lineHeight: 1.28,
                      maxWidth: '420px',
                    }}
                  >
                    {stageSummary}
                  </div>
                </div>

                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: '22px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: EFFECTS.panelShadow,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minWidth: '180px',
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
                    Focus
                  </div>
                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: '19px',
                      fontWeight: 700,
                      lineHeight: 1.2,
                    }}
                  >
                    {primaryChip}
                  </div>
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  right: 26,
                  top: 26,
                  fontFamily: FONTS.display,
                  fontSize: '160px',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'rgba(255,255,255,0.04)',
                  letterSpacing: '-8px',
                  zIndex: 1,
                }}
              >
                {String(sceneIndex + 1).padStart(2, '0')}
              </div>

              <div
                style={{
                  position: 'absolute',
                  inset: '176px 24px 116px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2,
                }}
              >
                {renderVisual()}
              </div>

              <div
                style={{
                  position: 'absolute',
                  left: 28,
                  right: 28,
                  bottom: 28,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '14px',
                  zIndex: 3,
                }}
              >
                <div
                  style={{
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
                      marginBottom: '8px',
                    }}
                  >
                    Pattern
                  </div>
                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: '18px',
                      fontWeight: 700,
                      lineHeight: 1.28,
                    }}
                  >
                    {trimWords(beats[0] || scene.text, 7)}
                  </div>
                </div>

                <div
                  style={{
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
                      marginBottom: '8px',
                    }}
                  >
                    Outcome
                  </div>
                  <div
                    style={{
                      color: COLORS.textWhite,
                      fontSize: '18px',
                      fontWeight: 700,
                      lineHeight: 1.28,
                    }}
                  >
                    {outcomeBeat}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: 'absolute',
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          bottom: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 3,
        }}
      >
        <div
          style={{
            color: COLORS.textMuted,
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            minWidth: '96px',
          }}
        >
          Signal
        </div>
        <div
          style={{
            flex: 1,
            height: '8px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: '999px',
              background: `linear-gradient(90deg, ${accent} 0%, rgba(255,255,255,0.85) 100%)`,
              boxShadow: EFFECTS.neonGlow(accent, 0.55),
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default ConceptScene;
