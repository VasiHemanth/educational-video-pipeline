import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnswerSection, DiagramInfo, DesignProps } from '../types';
import { mergeDesign, getBulletChar } from '../designDefaults';
import { NativeDiagram } from './NativeDiagram';
import React from 'react';

function isKeyword(rawWord: string, keywords: AnswerSection['keywords']): boolean {
    const clean = rawWord.replace(/[.*,;:!?'"()]/g, '').toLowerCase();
    if (keywords?.tech_terms?.some(k => clean.includes(k.toLowerCase()))) return true;
    if (keywords?.concepts?.some(k => clean.includes(k.toLowerCase()))) return true;
    return false;
}

export const ContentSection: React.FC<{
    section: AnswerSection;
    diagram?: DiagramInfo;
    sectionIndex?: number;
    config?: import('../types').VideoProps['config'];
    design?: DesignProps;
}> = ({ section, diagram, sectionIndex = 0, config, design: rawDesign }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const d = mergeDesign(rawDesign);
    const p = d.palette;
    const t = d.typography;

    const hasDiagram = !!(diagram && (diagram.pngPath || diagram.isNative));
    const accentColors = p.gradients.sectionAccents;
    const accent = accentColors[sectionIndex % accentColors.length];

    const rawText = section.text || section.spoken_audio || '';
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const words = rawText.split(' ');

    const secTiming = config?.sectionTimings?.find(s => s.id === section.id);
    const phaseA = secTiming ? secTiming.phaseAFrames : words.length * 4;
    const phaseB = secTiming ? secTiming.phaseBFrames : 15;

    const diagramStartFrame = phaseA + phaseB;
    const diagramSpring = spring({ fps, frame: frame - diagramStartFrame, config: { damping: 80, stiffness: 60 } });
    const diagramY = interpolate(diagramSpring, [0, 1], [60, 0]);
    const diagramOpacity = interpolate(diagramSpring, [0, 1], [0, 1]);

    const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });

    const baseFontSize = hasDiagram ? Math.min(t.bodySize, 40) : t.bodySize;
    let fontSize = baseFontSize;
    if (words.length > 20) fontSize = baseFontSize - 4;

    // ── Glass card entrance ──
    const cardSpring = spring({ fps, frame, config: { damping: 80, stiffness: 60 } });
    const cardOpacity = interpolate(cardSpring, [0, 1], [0, 1]);
    const cardY = interpolate(cardSpring, [0, 1], [20, 0]);

    // ── Pill badge fill sweep ──
    const badgeSpring = spring({ fps, frame, config: { damping: 70, stiffness: 100 } });
    const badgeFillX = interpolate(badgeSpring, [0, 1], [-100, 0]);
    const dotPulse = interpolate(Math.sin(frame / 15) * 0.5 + 0.5, [0, 1], [0.5, 1]);

    // ── Text reveal variants ──
    const renderTextContent = () => {
        const revealType = d.animations.textReveal.type;
        const staggerDelay = d.animations.textReveal.staggerDelay;

        if (lines.length > 1) {
            return lines.map((line: string, lineIdx: number) => {
                const lineWords = line.split(' ');
                const lineStartWordIdx = lines.slice(0, lineIdx).join(' ').split(' ').filter((w: string) => w).length;

                let lineOpacity = 1;
                let lineTransform = '';

                switch (revealType) {
                    case 'line-by-line': {
                        const revealFrame = (lineStartWordIdx / Math.max(1, words.length)) * (phaseA * 0.8);
                        lineOpacity = frame >= revealFrame ? 1 : 0.38;
                        break;
                    }
                    case 'fade-lines': {
                        const revealFrame = lineIdx * staggerDelay;
                        const lineSpring = spring({ fps, frame: frame - revealFrame, config: { damping: 60, stiffness: 80 } });
                        lineOpacity = lineSpring;
                        lineTransform = `translateY(${interpolate(lineSpring, [0, 1], [15, 0])}px)`;
                        break;
                    }
                    case 'highlight-sweep': {
                        const sweepProgress = interpolate(frame, [0, phaseA], [0, 1], { extrapolateRight: 'clamp' });
                        const lineProgress = lineIdx / lines.length;
                        lineOpacity = sweepProgress > lineProgress ? 1 : 0.25;
                        break;
                    }
                    case 'word-by-word':
                    default: {
                        const revealFrame = (lineStartWordIdx / Math.max(1, words.length)) * (phaseA * 0.8);
                        lineOpacity = frame >= revealFrame ? 1 : 0.38;
                        break;
                    }
                }

                const bullet = getBulletChar(d.layout.bulletStyle, lineIdx);

                return (
                    <div key={lineIdx} style={{
                        opacity: lineOpacity,
                        transform: lineTransform,
                        color: p.text,
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}>
                        <span style={{ color: accent, fontWeight: t.keywordWeight, fontSize: `${fontSize * 0.7}px`, flexShrink: 0 }}>{bullet}</span>
                        <span>
                            {lineWords.map((word: string, wi: number) => {
                                const highlight = isKeyword(word, section.keywords);
                                return (
                                    <span key={wi} style={{
                                        color: highlight ? accent : p.text,
                                        fontWeight: highlight ? t.keywordWeight : t.bodyWeight,
                                    }}>
                                        {word.replace(/\*/g, '')}{' '}
                                    </span>
                                );
                            })}
                        </span>
                    </div>
                );
            });
        }

        // Single block — word-by-word highlight
        const typeRate = phaseA / Math.max(1, words.length);
        const wordsToReveal = Math.min(words.length, Math.floor(frame / typeRate) + 1);

        return words.map((word: string, i: number) => {
            if (d.animations.textReveal.type === 'word-by-word' && i >= wordsToReveal) return null;
            const highlight = isKeyword(word, section.keywords);
            const revealFrame = (i / words.length) * (phaseA * 0.8);
            const isRevealed = frame >= revealFrame;

            return (
                <span key={i} style={{
                    color: isRevealed ? (highlight ? accent : p.text) : p.textMuted,
                    opacity: isRevealed ? 1 : 0.38,
                    fontWeight: highlight ? t.keywordWeight : t.bodyWeight,
                }}>
                    {word.replace(/\*/g, '')}{' '}
                </span>
            );
        });
    };

    // ── Background effects ──
    const renderGlow = () => {
        if (d.effects.backgroundType === 'none') return null;

        if (d.effects.backgroundType === 'mesh-gradient') {
            const blob1X = interpolate(Math.sin(frame / 40) * 0.5 + 0.5, [0, 1], [10, 50]);
            const blob2X = interpolate(Math.cos(frame / 55) * 0.5 + 0.5, [0, 1], [40, 80]);
            const blob1Y = interpolate(Math.cos(frame / 45) * 0.5 + 0.5, [0, 1], [-10, 20]);
            return (
                <>
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse 60% 40% at ${blob1X}% ${blob1Y}%, ${accent}25 0%, transparent 70%)`,
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: `radial-gradient(ellipse 50% 35% at ${blob2X}% 70%, ${p.secondary}18 0%, transparent 65%)`,
                        pointerEvents: 'none',
                    }} />
                </>
            );
        }

        return (
            <div style={{
                position: 'absolute',
                top: '-20%', left: '-20%', right: '-20%', height: '70%',
                background: `radial-gradient(ellipse at top, ${accent}20 0%, transparent 60%)`,
                opacity: 0.8,
                pointerEvents: 'none',
            }} />
        );
    };

    // ── Progress bar ──
    const renderProgressBar = () => {
        if (!d.layout.progressBar || d.layout.progressBarStyle === 'none') return null;
        const barStyle = d.layout.progressBarStyle === 'glow'
            ? { backgroundColor: accent, boxShadow: `0 0 20px ${accent}` }
            : { backgroundColor: accent };

        return (
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div style={{ width: `${progress}%`, height: '100%', ...barStyle }} />
            </div>
        );
    };

    // ── Glass card geometry ──
    const cardTop = d.layout.sectionTitleTop - 24;
    const textZoneHeight = Math.floor(0.22 * 1920);
    const cardHeight = (d.layout.sectionTextTop - d.layout.sectionTitleTop) + textZoneHeight + 48;

    return (
        <AbsoluteFill style={{
            backgroundColor: p.background,
            fontFamily: t.fontFamily,
            overflow: 'hidden',
        }}>
            {renderGlow()}

            {/* SVG background assets */}
            {d.svgAssets?.filter(a => a.placement === 'background').map(asset => (
                <div key={asset.id} style={{
                    position: 'absolute', inset: 0, opacity: asset.opacity, pointerEvents: 'none',
                }} dangerouslySetInnerHTML={{ __html: asset.svg }} />
            ))}

            {/* GLASS CARD — sits behind title + text */}
            <div style={{
                position: 'absolute',
                top: cardTop,
                left: 50, right: 50,
                height: cardHeight,
                background: 'rgba(255,255,255,0.035)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: `1px solid ${accent}18`,
                borderRadius: '28px',
                boxShadow: `0 0 60px ${accent}08, inset 0 1px 0 rgba(255,255,255,0.06)`,
                opacity: cardOpacity,
                transform: `translateY(${cardY}px)`,
                pointerEvents: 'none',
            }} />

            {/* TITLE — pill badge + section title */}
            <div style={{
                position: 'absolute',
                top: d.layout.sectionTitleTop, left: 80, right: 200,
                textAlign: 'left',
                display: 'flex', flexDirection: 'column', gap: '10px',
                zIndex: 1,
            }}>
                {/* Animated pill badge */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    alignSelf: 'flex-start',
                    padding: '6px 16px 6px 10px',
                    borderRadius: '100px',
                    border: `1px solid ${accent}40`,
                    overflow: 'hidden',
                    position: 'relative',
                }}>
                    {/* fill sweep layer */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: accent,
                        transform: `translateX(${badgeFillX}%)`,
                        borderRadius: '100px',
                    }} />
                    {/* pulsing dot — snaps color once badge fill arrives */}
                    <div style={{
                        position: 'relative',
                        width: '8px', height: '8px',
                        borderRadius: '50%',
                        background: badgeFillX > -10 ? p.background : accent,
                        opacity: dotPulse,
                        flexShrink: 0,
                    }} />
                    <span style={{
                        position: 'relative',
                        fontSize: `${t.labelSize}px`,
                        fontWeight: 700,
                        color: badgeFillX > -10 ? p.background : accent,
                        letterSpacing: '2px',
                        textTransform: 'uppercase' as const,
                    }}>
                        Step 0{sectionIndex + 1}
                    </span>
                </div>

                <div style={{
                    fontSize: `${t.titleSize}px`,
                    fontWeight: t.titleWeight,
                    color: p.text,
                    letterSpacing: '-1px',
                    lineHeight: 1.1,
                }}>
                    {section.title}
                </div>
            </div>

            {/* TEXT */}
            <div style={{
                position: 'absolute',
                top: d.layout.sectionTextTop,
                left: 80, right: 80,
                height: '22%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
                zIndex: 1,
            }}>
                <div style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.55,
                    fontWeight: t.bodyWeight,
                    color: p.textMuted,
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    width: '100%',
                }}>
                    {renderTextContent()}
                </div>
            </div>

            {/* DIAGRAM */}
            {hasDiagram && (
                <div style={{
                    position: 'absolute',
                    top: d.layout.diagramTop, bottom: d.layout.diagramBottom,
                    left: 60, right: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `translateY(${diagramY}px)`,
                    opacity: diagramOpacity,
                    overflow: 'visible',
                    zIndex: 1,
                }}>
                    {diagram!.isNative && diagram!.dsl ? (
                        <NativeDiagram dsl={diagram!.dsl} accent={accent} phaseA={phaseA} phaseB={phaseB} design={d} />
                    ) : (
                        <img
                            src={diagram!.pngPath!}
                            style={{
                                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                filter: 'invert(1) hue-rotate(180deg) brightness(1.2) contrast(0.9)',
                            }}
                        />
                    )}
                </div>
            )}

            {/* WATERMARK */}
            <div style={{
                position: 'absolute',
                bottom: 60, left: 80,
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                opacity: 0.55,
                zIndex: 1,
            }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: p.textMuted, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    AI Cloud Architect
                </div>
                <div style={{ fontSize: '11px', fontWeight: 500, color: p.textMuted, letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px' }}>
                    by Hemanth Vasi
                </div>
            </div>

            {renderProgressBar()}
        </AbsoluteFill>
    );
};
