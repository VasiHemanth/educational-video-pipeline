/**
 * KineticText — Word-by-word text reveal with keyword color-coding
 *
 * Inspired by reference video's "text economy" approach:
 * - Words reveal one at a time with subtle translateY + opacity
 * - Keywords (tech terms) glow in the accent color
 * - Multi-line text splits on \n and adds ▸ bullet prefix
 * - Font size auto-scales based on word count
 *
 * Usage:
 *   <KineticText
 *     text="Implement RAG workflow.\nVector DB retrieval."
 *     keywords={{ tech_terms: ['RAG', 'Vector DB'] }}
 *     accent="#2997FF"
 *     startFrame={30}
 *   />
 */

import React from 'react';
import { interpolate, Easing, useCurrentFrame } from 'remotion';
import { TIMING } from './presets';
import { COLORS, FONTS } from '../design/theme';
import { KeywordSet } from '../EducationalTypes';

interface KineticTextProps {
  text: string;
  keywords?: KeywordSet;
  accent?: string;
  /** Frame at which the text starts revealing */
  startFrame?: number;
  /** Override font size (otherwise auto-calculated) */
  fontSize?: number;
  /** Maximum width in px */
  maxWidth?: number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Show bullet prefix on multi-line text */
  showBullets?: boolean;
  /** Override frames per word */
  framesPerWord?: number;
  /** Animate one word at a time or reveal full lines / phrases */
  revealMode?: 'word' | 'line';
}

// Auto-scale font based on total word count
function getAutoFontSize(wordCount: number): number {
  if (wordCount <= 8) return 52;
  if (wordCount <= 14) return 44;
  if (wordCount <= 20) return 38;
  if (wordCount <= 30) return 32;
  return 26;
}

function isKeyword(rawWord: string, keywords?: KeywordSet): boolean {
  if (!keywords) return false;
  const clean = rawWord.replace(/[.,;:!?'"()[\]*/]/g, '').toLowerCase();
  if (keywords.tech_terms?.some(k => clean.includes(k.toLowerCase()))) return true;
  if (keywords.concepts?.some(k => clean.includes(k.toLowerCase()))) return true;
  return false;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  keywords,
  accent = COLORS.neonCyan,
  startFrame = 0,
  fontSize: fontSizeOverride,
  maxWidth = 920,
  align = 'left',
  showBullets = true,
  framesPerWord = TIMING.FRAMES_PER_WORD,
  revealMode = 'word',
}) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;

  // Parse text into lines
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const allWords = lines.flatMap(line => line.split(/\s+/).filter(Boolean));
  const totalWords = allWords.length;

  const fontSize = fontSizeOverride || getAutoFontSize(totalWords);

  // Build word timing map
  const wordTimings: number[] = [];
  let currentWordFrame = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const wordsInLine = lines[lineIdx].split(/\s+/).filter(Boolean);
    for (let w = 0; w < wordsInLine.length; w++) {
      wordTimings.push(currentWordFrame);
      currentWordFrame += framesPerWord;
    }
    // Add pause between lines
    if (lineIdx < lines.length - 1) {
      currentWordFrame += TIMING.LINE_PAUSE_FRAMES;
    }
  }

  // Render function
  let globalWordIdx = 0;

  return (
    <div
      style={{
        fontFamily: FONTS.primary,
        fontSize: `${fontSize}px`,
        lineHeight: 1.35,
        fontWeight: 500,
        textAlign: align,
        maxWidth: `${maxWidth}px`,
        width: '100%',
      }}
    >
      {lines.map((line, lineIdx) => {
        const wordsInLine = line.split(/\s+/).filter(Boolean);
        const isMultiLine = lines.length > 1;

        const lineWords = wordsInLine.map((word, wIdx) => {
          const revealFrame = wordTimings[globalWordIdx];
          const lineRevealFrame = wordTimings[globalWordIdx - wIdx] || revealFrame;
          const activeRevealFrame = revealMode === 'line' ? lineRevealFrame : revealFrame;
          const highlight = isKeyword(word, keywords);

          const wordOpacity = interpolate(
            relativeFrame,
            [activeRevealFrame, activeRevealFrame + framesPerWord],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
          );

          const wordTranslateY = interpolate(
            relativeFrame,
            [activeRevealFrame, activeRevealFrame + framesPerWord],
            [revealMode === 'line' ? 18 : 12, 0],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
          );

          globalWordIdx++;

          return (
            <span
              key={`${lineIdx}-${wIdx}`}
              style={{
                opacity: wordOpacity,
                transform: `translateY(${wordTranslateY}px)`,
                display: 'inline-block',
                marginRight: `${fontSize * 0.22}px`,
                color: highlight ? accent : COLORS.textWhite,
                fontWeight: highlight ? 700 : 400,
                textShadow: highlight
                  ? `0 0 20px ${accent}40`
                  : undefined,
              }}
            >
              {word.replace(/\*/g, '')}
            </span>
          );
        });

        return (
          <div
            key={`line-${lineIdx}`}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: align === 'center' ? 'center' : 'flex-start',
              alignItems: 'center',
              marginBottom: `${fontSize * 0.3}px`,
              gap: isMultiLine ? '8px' : undefined,
            }}
          >
            {/* Bullet prefix for multi-line */}
            {isMultiLine && showBullets && (
              <span
                style={{
                  color: accent,
                  fontWeight: 700,
                  fontSize: `${fontSize * 0.7}px`,
                  flexShrink: 0,
                  opacity: interpolate(
                    relativeFrame,
                    [wordTimings[globalWordIdx - wordsInLine.length] || 0, (wordTimings[globalWordIdx - wordsInLine.length] || 0) + framesPerWord],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                  ),
                }}
              >
                ▸
              </span>
            )}
            <span>{lineWords}</span>
          </div>
        );
      })}
    </div>
  );
};

export default KineticText;
