/**
 * CardStack — Stacked card reveal for numbered concepts
 *
 * Inspired by reference video's "Secret #1, #2, #3" pattern:
 * - Cards appear one by one with spring pop-in
 * - Each card has a number badge, title, and short body
 * - Depth shadow increases per card for visual layering
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { SPRING_PRESETS } from './presets';
import { COLORS, FONTS, EFFECTS, ACCENT_CYCLE } from '../design/theme';
import { CardStackData } from '../EducationalTypes';

interface CardStackProps {
  data: CardStackData;
  accent?: string;
  /** Frame at which animation starts */
  startFrame?: number;
  /** Stagger between cards in frames */
  staggerFrames?: number;
}

export const CardStack: React.FC<CardStackProps> = ({
  data,
  accent = COLORS.neonCyan,
  startFrame = 0,
  staggerFrames = 20,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;



  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        width: '100%',
        maxWidth: '900px',
        fontFamily: FONTS.primary,
      }}
    >
      {data.cards.map((card, i) => {
        const cardAppearFrame = i * staggerFrames;
        const cardSpring = spring({
          fps,
          frame: relFrame - cardAppearFrame,
          config: SPRING_PRESETS.bouncy,
        });

        const scale = interpolate(cardSpring, [0, 1], [0.7, 1]);
        const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
        const translateY = interpolate(cardSpring, [0, 1], [40, 0]);

        const cardAccent = card.accentColor || ACCENT_CYCLE[i % ACCENT_CYCLE.length];
        const depth = i + 1;

        return (
          <div
            key={i}
            style={{
              transform: `scale(${scale}) translateY(${translateY}px)`,
              opacity,
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '24px 28px',
              borderRadius: '18px',
              backgroundColor: COLORS.surface,
              border: `2px solid ${cardAccent}30`,
              boxShadow: `${EFFECTS.cardShadow(depth)}, ${EFFECTS.innerGlow(cardAccent, 0.06)}`,
              willChange: 'transform, opacity',
            }}
          >
            {/* Number badge */}
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                backgroundColor: `${cardAccent}18`,
                border: `2px solid ${cardAccent}50`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {card.icon ? (
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
              ) : (
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: cardAccent,
                    letterSpacing: '-0.5px',
                  }}
                >
                  #{i + 1}
                </span>
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              {/* Card title */}
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: COLORS.textWhite,
                  letterSpacing: '-0.3px',
                  marginBottom: '4px',
                }}
              >
                {card.title}
              </div>

              {/* Card body */}
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 400,
                  color: COLORS.textMuted,
                  lineHeight: 1.4,
                }}
              >
                {card.body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CardStack;
