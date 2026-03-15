/**
 * SplitComparison — Side-by-side "Before vs After" layout
 *
 * Inspired by reference video's A/B comparison technique:
 * - Left panel: "Bad" state with red accent, ✗ icon
 * - Right panel: "Good" state with green accent, ✓ icon
 * - Sequential reveal: left slides in → pause → right slides in
 * - Optional metric bar between panels showing improvement
 */

import React from 'react';
import { spring, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { SPRING_PRESETS } from './presets';
import { COLORS, FONTS, EFFECTS } from '../design/theme';
import { ComparisonData } from '../EducationalTypes';

interface SplitComparisonProps {
  data: ComparisonData;
  /** Frame at which animation starts */
  startFrame?: number;
  /** Accent color for the "good" panel */
  goodColor?: string;
  /** Accent color for the "bad" panel */
  badColor?: string;
}

export const SplitComparison: React.FC<SplitComparisonProps> = ({
  data,
  startFrame = 0,
  goodColor = COLORS.success,
  badColor = COLORS.error,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  // Phase 1: Left (before/bad) panel slides in
  const leftSpring = spring({
    fps,
    frame: relFrame,
    config: SPRING_PRESETS.tactile,
  });
  const leftX = interpolate(leftSpring, [0, 1], [-80, 0]);
  const leftOpacity = interpolate(leftSpring, [0, 1], [0, 1]);

  // Phase 2: Right (after/good) panel slides in (delayed 20 frames)
  const rightSpring = spring({
    fps,
    frame: relFrame - 20,
    config: SPRING_PRESETS.bouncy,
  });
  const rightX = interpolate(rightSpring, [0, 1], [80, 0]);
  const rightOpacity = interpolate(rightSpring, [0, 1], [0, 1]);

  // Phase 3: Metric bar animates in (delayed 40 frames)
  const metricOpacity = interpolate(relFrame, [40, 55], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const panelStyle = (isGood: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '32px 24px',
    borderRadius: '20px',
    backgroundColor: COLORS.surface,
    border: `3px solid ${isGood ? goodColor : badColor}40`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    boxShadow: EFFECTS.innerGlow(isGood ? goodColor : badColor, 0.08),
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '24px',
        width: '100%',
        maxWidth: '960px',
        fontFamily: FONTS.primary,
      }}
    >
      {/* Left Panel — Before / Bad */}
      <div
        style={{
          ...panelStyle(false),
          transform: `translateX(${leftX}px)`,
          opacity: leftOpacity,
        }}
      >
        {/* Status icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: `${badColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: badColor,
          }}
        >
          ✗
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: badColor,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}
        >
          {data.before.label}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 400,
            color: COLORS.textMuted,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {data.before?.description || data.before?.label}
        </div>
      </div>

      {/* Right Panel — After / Good */}
      <div
        style={{
          ...panelStyle(true),
          transform: `translateX(${rightX}px)`,
          opacity: rightOpacity,
        }}
      >
        {/* Status icon */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: `${goodColor}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: goodColor,
          }}
        >
          ✓
        </div>

        {/* Label */}
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: goodColor,
            textAlign: 'center',
            letterSpacing: '-0.5px',
          }}
        >
          {data.after.label}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '22px',
            fontWeight: 400,
            color: COLORS.textWhite,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          {data.after?.description || data.after?.label}
        </div>
      </div>

      {/* Metric bar (bottom overlay) — if provided */}
      {data.metric && (
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            opacity: metricOpacity,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 32px',
            borderRadius: '12px',
            backgroundColor: `${COLORS.surface}E0`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <span style={{ fontSize: '20px', color: COLORS.textMuted, fontFamily: FONTS.primary }}>
            {data.metric.label}:
          </span>
          <span style={{ fontSize: '24px', color: badColor, fontWeight: 700, fontFamily: FONTS.primary, textDecoration: 'line-through' }}>
            {data.metric.beforeValue}
          </span>
          <span style={{ fontSize: '20px', color: COLORS.textMuted }}>→</span>
          <span style={{ fontSize: '24px', color: goodColor, fontWeight: 700, fontFamily: FONTS.primary }}>
            {data.metric.afterValue}
          </span>
        </div>
      )}
    </div>
  );
};

export default SplitComparison;
