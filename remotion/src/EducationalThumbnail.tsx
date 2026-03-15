import React from 'react';
import { AbsoluteFill } from 'remotion';
import { EducationalReelProps } from './EducationalTypes';
import { GrainOverlay } from './design/GrainOverlay';
import { MoodBackground } from './design/MoodBackground';
import { COLORS, EFFECTS, FONTS } from './design/theme';

export const EducationalThumbnail: React.FC<EducationalReelProps> = ({
  content,
  config,
}) => {
  const headline = config?.thumbnail_headline || content.topic || 'Architecture Explained';
  const subhead = config?.thumbnail_subheadline || content.domain || '';
  const accent = COLORS.neonCyan;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, fontFamily: FONTS.primary }}>
      <MoodBackground moodColor={COLORS.bg} accentColor={accent} spotlightY={0.34} />
      <GrainOverlay opacity={0.04} />

      <div
        style={{
          position: 'absolute',
          inset: '124px 72px 120px',
          borderRadius: '42px',
          border: '1px solid rgba(255,255,255,0.08)',
          background:
            'linear-gradient(165deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
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
            opacity: 0.2,
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            display: 'inline-flex',
            padding: '12px 18px',
            borderRadius: '999px',
            border: `1px solid ${accent}44`,
            background: `rgba(255,255,255,0.07)`,
            color: accent,
            fontSize: '22px',
            fontWeight: 800,
            letterSpacing: '4px',
            textTransform: 'uppercase',
          }}
        >
          {subhead}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 48,
            right: 48,
            top: 164,
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: '122px',
              fontWeight: 800,
              color: COLORS.textWhite,
              lineHeight: 0.92,
              letterSpacing: '-4px',
              textTransform: 'uppercase',
              textShadow: EFFECTS.textShadow,
              whiteSpace: 'pre-wrap',
            }}
          >
            {headline}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '84px',
                height: '10px',
                borderRadius: '999px',
                background: accent,
                boxShadow: EFFECTS.neonGlow(accent, 0.8),
              }}
            />
            <div
              style={{
                color: COLORS.textMuted,
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '2.2px',
                textTransform: 'uppercase',
              }}
            >
              Dynamic educational reel
            </div>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            right: -30,
            bottom: -38,
            fontFamily: FONTS.display,
            fontSize: '320px',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.05)',
            lineHeight: 1,
            letterSpacing: '-16px',
          }}
        >
          01
        </div>

        <div
          style={{
            position: 'absolute',
            left: 40,
            bottom: 36,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              color: COLORS.textWhite,
              fontSize: '26px',
              fontWeight: 800,
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            {config?.watermark || 'LEARN'}
          </div>
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            {config?.watermarkSub || 'Signal-first explainers'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
