import {
    AbsoluteFill,
    Audio,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    Easing,
} from 'remotion';
import React from 'react';
import { MotivationReelProps, FontStyle } from './MotivationTypes';
import { GrainOverlay } from './design/GrainOverlay';

// ─── Load Google Fonts ──────────────────────────────────────────────────────
import { loadFont as loadPlayfair } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadCormorant } from '@remotion/google-fonts/CormorantGaramond';
import { loadFont as loadDMSerif } from '@remotion/google-fonts/DMSerifDisplay';

const { fontFamily: playfairFamily } = loadPlayfair();
const { fontFamily: cormorantFamily } = loadCormorant();
const { fontFamily: dmSerifFamily } = loadDMSerif();

// ─── Font Configurations ────────────────────────────────────────────────────
const FONT_MAP: Record<FontStyle, { family: string; weight: number; style: string }> = {
    'playfair': {
        family: playfairFamily,
        weight: 700,
        style: 'normal',
    },
    'cormorant': {
        family: cormorantFamily,
        weight: 600,
        style: 'italic',
    },
    'dm-serif': {
        family: dmSerifFamily,
        weight: 400,
        style: 'normal',
    },
};

// ─── Font Size Scaling ──────────────────────────────────────────────────────
const getFontSize = (wordCount: number): number => {
    if (wordCount <= 8) return 82;
    if (wordCount <= 14) return 72;
    if (wordCount <= 20) return 62;
    if (wordCount <= 30) return 52;
    return 44;
};

// ─── Main Component ─────────────────────────────────────────────────────────
export const MotivationReel: React.FC<MotivationReelProps> = ({
    quote,
    watermark = 'LEVEL UP',
    fontStyle = 'playfair',
    bgStyle = 'pure-black',
    audioSrc,
    audioVolume = 0.2,
}) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // ─── Parse quote into lines (split on \n) ───────────────────────────
    const lines = quote.split('\n').filter((l) => l.trim().length > 0);
    const allWords = lines.flatMap((line) => line.split(/\s+/).filter(Boolean));
    const totalWords = allWords.length;

    // ─── Animation timing ───────────────────────────────────────────────
    const WORD_REVEAL_FRAMES = 5; // frames per word reveal
    const LINE_PAUSE_FRAMES = 12; // pause between lines
    const FADE_OUT_FRAMES = 20;   // fade out at end

    // Build word timing map: { wordIndex -> startFrame }
    const wordTimings: number[] = [];
    let currentFrame = 20; // initial delay before first word
    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const wordsInLine = lines[lineIdx].split(/\s+/).filter(Boolean);
        for (let w = 0; w < wordsInLine.length; w++) {
            wordTimings.push(currentFrame);
            currentFrame += WORD_REVEAL_FRAMES;
        }
        // Pause after each line (except last)
        if (lineIdx < lines.length - 1) {
            currentFrame += LINE_PAUSE_FRAMES;
        }
    }

    // ─── Font config ────────────────────────────────────────────────────
    const fontConfig = FONT_MAP[fontStyle];
    const fontSize = getFontSize(totalWords);

    // ─── Background ─────────────────────────────────────────────────────
    const getBgStyle = (): React.CSSProperties => {
        switch (bgStyle) {
            case 'subtle-gradient':
                return {
                    background: 'radial-gradient(ellipse at 50% 40%, #0a0a0a 0%, #000000 100%)',
                };
            case 'grain':
            case 'pure-black':
            default:
                return { backgroundColor: '#000000' };
        }
    };

    // ─── Fade out at end ────────────────────────────────────────────────
    const fadeOut = interpolate(
        frame,
        [durationInFrames - FADE_OUT_FRAMES, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // ─── Watermark animation ────────────────────────────────────────────
    const watermarkOpacity = interpolate(frame, [40, 70], [0, 0.35], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
    });

    // ─── Render words with reveal ───────────────────────────────────────
    const renderQuote = () => {
        let globalWordIdx = 0;

        return lines.map((line, lineIdx) => {
            const wordsInLine = line.split(/\s+/).filter(Boolean);
            const lineWords = wordsInLine.map((word, wIdx) => {
                const revealFrame = wordTimings[globalWordIdx];
                const wordOpacity = interpolate(
                    frame,
                    [revealFrame, revealFrame + WORD_REVEAL_FRAMES],
                    [0, 1],
                    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }
                );
                const wordTranslateY = interpolate(
                    frame,
                    [revealFrame, revealFrame + WORD_REVEAL_FRAMES],
                    [12, 0],
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
                            marginRight: `${fontSize * 0.28}px`,
                        }}
                    >
                        {word}
                    </span>
                );
            });

            return (
                <div
                    key={`line-${lineIdx}`}
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        marginBottom: `${fontSize * 0.35}px`,
                    }}
                >
                    {lineWords}
                </div>
            );
        });
    };

    return (
        <AbsoluteFill
            style={{
                ...getBgStyle(),
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden',
                opacity: fadeOut,
            }}
        >
            {/* Grain overlay */}
            {(bgStyle === 'grain' || bgStyle === 'pure-black') && <GrainOverlay />}

            {/* Background audio */}
            {audioSrc && <Audio src={audioSrc} volume={audioVolume} loop />}

            {/* ─── Quote Text ─── */}
            <div
                style={{
                    position: 'absolute',
                    top: '28%',
                    bottom: '22%',
                    left: '80px',
                    right: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        fontFamily: fontConfig.family,
                        fontSize: `${fontSize}px`,
                        fontWeight: fontConfig.weight,
                        fontStyle: fontConfig.style,
                        color: '#FFFFFF',
                        lineHeight: 1.4,
                        textAlign: 'center',
                        maxWidth: '920px',
                        textShadow: '0 4px 24px rgba(255, 255, 255, 0.08)',
                        letterSpacing: '-0.5px',
                    }}
                >
                    {renderQuote()}
                </div>
            </div>

            {/* ─── Watermark: LEVEL UP ─── */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '80px',
                    opacity: watermarkOpacity * fadeOut,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                }}
            >
                <div
                    style={{
                        fontSize: '28px',
                        fontWeight: 800,
                        color: '#FFFFFF',
                        letterSpacing: '8px',
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', 'SF Pro Display', sans-serif",
                    }}
                >
                    {watermark}
                </div>
                <div
                    style={{
                        width: '40px',
                        height: '3px',
                        background: 'linear-gradient(90deg, #FFFFFF 0%, transparent 100%)',
                        opacity: 0.6,
                    }}
                />
            </div>
        </AbsoluteFill>
    );
};

export default MotivationReel;
