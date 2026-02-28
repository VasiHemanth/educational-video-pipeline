import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnswerSection, DiagramInfo } from '../types';
import { NativeDiagram } from './NativeDiagram';

const G = {
    blue: '#2997FF', // Apple-esque bright blue
    purple: '#BF5AF2', // Apple-esque purple
    orange: '#FF9F0A', // Apple-esque orange
    green: '#32D74B', // Apple-esque green
    bg: '#0A0A0A', // Deep pure dark
    surface: '#1C1C1E',
    border: '#333336',
    textWhite: '#F5F5F7',
    textMuted: '#86868B',
};

const ACCENTS = [G.blue, G.purple, G.orange, G.green];

function isKeyword(rawWord: string, keywords: AnswerSection['keywords']): boolean {
    const cleanWord = rawWord.replace(/\*/g, '');
    const clean = cleanWord.replace(/[.,;:!?'"()]/g, '').toLowerCase();
    if (keywords?.tech_terms?.some(k => clean.includes(k.toLowerCase()))) return true;
    if (keywords?.concepts?.some(k => clean.includes(k.toLowerCase()))) return true;
    return false;
}

export const ContentSection: React.FC<{
    section: AnswerSection;
    diagram?: DiagramInfo;
    sectionIndex?: number;
    config?: import('../types').VideoProps['config'];
}> = ({ section, diagram, sectionIndex = 0, config }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const hasDiagram = !!(diagram && (diagram.pngPath || diagram.isNative));
    const accent = ACCENTS[sectionIndex % ACCENTS.length];

    const animStyle = config?.animStyle || 'highlight';

    // Use text as primary text source for screen display
    // Split by newlines first to handle \n line breaks in the text field
    const rawText = section.text || section.spoken_audio || '';
    const lines = rawText.split('\n').filter((l: string) => l.trim().length > 0);
    const words = rawText.split(' ');

    const secTiming = config?.sectionTimings?.find(s => s.id === section.id);
    const phaseA = secTiming ? secTiming.phaseAFrames : words.length * 4;
    const phaseB = secTiming ? secTiming.phaseBFrames : 15;

    const typeRate = phaseA / Math.max(1, words.length);
    const wordsToReveal = Math.min(words.length, Math.floor(frame / typeRate) + 1);

    const diagramStartFrame = phaseA + phaseB;
    const diagramSpring = spring({ fps, frame: frame - diagramStartFrame, config: { damping: 80, stiffness: 60 } });
    const diagramY = interpolate(diagramSpring, [0, 1], [60, 0]);
    const diagramOpacity = interpolate(diagramSpring, [0, 1], [0, 1]);

    // Container fade out at the end
    const fadeOutStart = durationInFrames - 15;
    const containerOpacity = interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

    const baseFontSize = hasDiagram ? 40 : 48; // Adjusted for 3-5 lines

    // Dynamic Font Sizing
    let fontSize = baseFontSize;
    if (words.length > 20) {
        fontSize = baseFontSize - 4;
    }

    const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg,
            fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
            opacity: animStyle === 'fade' ? containerOpacity : 1,
            overflow: 'hidden',
        }}>
            {/* --- SUBTLE RADIAL GLOW --- */}
            <div style={{
                position: 'absolute',
                top: '-20%', left: '-20%', right: '-20%', height: '70%',
                background: `radial-gradient(ellipse at top, ${accent}20 0%, transparent 60%)`,
                opacity: 0.8,
                pointerEvents: 'none'
            }} />

            {/* --- TITLE (TOP ZONE) — cleared Instagram top chrome ~180px --- */}
            <div style={{
                position: 'absolute',
                top: 200, left: 80, right: 200,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            }}>
                <div style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: accent,
                    letterSpacing: '3px',
                    textTransform: 'uppercase'
                }}>
                    Step 0{sectionIndex + 1}
                </div>
                <div style={{
                    fontSize: '40px',
                    fontWeight: 800,
                    color: G.textWhite,
                    letterSpacing: '-1px',
                    lineHeight: 1.1
                }}>
                    {section.title}
                </div>
            </div>

            {/* --- TEXT (TOP ZONE) — below title, newlines rendered as bullet lines --- */}
            <div style={{
                position: 'absolute',
                top: 320,
                left: 80, right: 80,
                height: '22%',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start'
            }}>
                <div style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.5,
                    fontWeight: 400,
                    color: G.textMuted,
                    textAlign: 'left',
                    wordBreak: 'break-word',
                    whiteSpace: 'normal',
                    width: '100%',
                }}>
                    {lines.length > 1 ? (
                        // Render as structured lines with staggered reveal
                        lines.map((line: string, lineIdx: number) => {
                            const lineWords = line.split(' ');
                            const lineStartWordIdx = lines.slice(0, lineIdx).join(' ').split(' ').filter((w: string) => w).length;
                            const revealFrame = (lineStartWordIdx / Math.max(1, words.length)) * (phaseA * 0.8);
                            const isRevealed = frame >= revealFrame;
                            return (
                                <div key={lineIdx} style={{
                                    opacity: isRevealed ? 1 : 0.25,
                                    color: G.textWhite,
                                    marginBottom: '6px',
                                    transition: 'opacity 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <span style={{ color: accent, fontWeight: 700, fontSize: `${fontSize * 0.7}px`, flexShrink: 0 }}>▸</span>
                                    <span>
                                        {lineWords.map((word: string, wi: number) => {
                                            const highlight = isKeyword(word, section.keywords);
                                            return (
                                                <span key={wi} style={{
                                                    color: highlight ? accent : G.textWhite,
                                                    fontWeight: highlight ? 700 : 400,
                                                }}>
                                                    {word.replace(/\*/g, '')}{' '}
                                                </span>
                                            );
                                        })}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        // Single block of text — word-by-word highlight animation
                        words.map((word: string, i: number) => {
                            if (animStyle === 'type' && i >= wordsToReveal) return null;
                            const highlight = isKeyword(word, section.keywords);
                            let finalColor = G.textMuted;
                            let finalOpacity = 1;
                            let fontWeight = 400;
                            if (animStyle === 'highlight') {
                                const revealFrame = (i / words.length) * (phaseA * 0.8);
                                const isRevealed = frame >= revealFrame;
                                if (isRevealed) {
                                    finalColor = highlight ? accent : G.textWhite;
                                    fontWeight = highlight ? 700 : 400;
                                } else {
                                    finalColor = G.textMuted;
                                    finalOpacity = 0.3;
                                }
                            }
                            return (
                                <span key={i} style={{
                                    color: finalColor,
                                    opacity: finalOpacity,
                                    transition: 'color 0.15s, opacity 0.15s',
                                    fontWeight: fontWeight,
                                }}>
                                    {word.replace(/\*/g, '')}{' '}
                                </span>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- DIAGRAM (MIDDLE ZONE) --- */}
            {hasDiagram && (
                <div style={{
                    position: 'absolute',
                    top: '36%', bottom: '8%', // Expanded: more height for diagram (~1075px usable)
                    left: 60, right: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transform: `translateY(${diagramY}px)`,
                    opacity: diagramOpacity,
                    overflow: 'visible',
                    padding: '0px'
                }}>
                    {diagram!.isNative && diagram!.dsl ? (
                        <NativeDiagram dsl={diagram!.dsl} accent={accent} phaseA={phaseA} phaseB={phaseB} />
                    ) : (
                        <Img
                            src={diagram!.pngPath!}
                            style={{
                                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                filter: 'invert(1) hue-rotate(180deg) brightness(1.2) contrast(0.9)',
                            }}
                        />
                    )}
                </div>
            )}

            {/* --- WATERMARK — bottom-left, avoids Instagram share/save buttons on right --- */}
            <div style={{
                position: 'absolute',
                bottom: 60, left: 80,
                textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                opacity: 0.55
            }}>
                <div style={{
                    fontSize: '13px', fontWeight: 700, color: G.textMuted,
                    letterSpacing: '3px', textTransform: 'uppercase',
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '11px', fontWeight: 500, color: G.textMuted,
                    letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px',
                }}>
                    by Hemanth Vasi
                </div>
            </div>

            {/* --- PROGRESS BAR (FULL WIDTH AT BOTTOM) --- */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '12px', backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: accent, boxShadow: `0 0 20px ${accent}` }} />
            </div>
        </AbsoluteFill>
    );
};
