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

    const words = section.text?.split(' ') || [];

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

    const baseFontSize = hasDiagram ? 52 : 64;
    
    // Dynamic Font Sizing
    let fontSize = baseFontSize;
    if (words.length > 20) {
        fontSize = baseFontSize - 8; // Adjust for slightly longer texts
    } else if (words.length < 10) {
        fontSize = baseFontSize + 4; // Slightly larger for very short texts
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

            {/* --- TITLE --- */}
            <div style={{ 
                position: 'absolute', 
                top: 140, left: 60, right: 60, 
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 600, 
                    color: accent, 
                    letterSpacing: '2px', 
                    textTransform: 'uppercase' 
                }}>
                    Step 0{sectionIndex + 1}
                </div>
                <div style={{ 
                    fontSize: '56px', 
                    fontWeight: 800, 
                    color: G.textWhite,
                    letterSpacing: '-1px',
                    lineHeight: 1.1
                }}>
                    {section.title}
                </div>
            </div>

            {/* --- TEXT (TOP/MIDDLE ZONE) --- */}
            <div style={{
                position: 'absolute',
                top: 280,
                left: 60, right: 60,
                height: hasDiagram ? '35%' : '65%',
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
                    {words.map((word, i) => {
                        if (animStyle === 'type' && i >= wordsToReveal) return null;

                        const cleanWord = word.replace(/\*/g, '');
                        const highlight = isKeyword(word, section.keywords);

                        let finalColor = G.textMuted;
                        let finalOpacity = 1;
                        let textShadow = 'none';
                        let fontWeight = 400;

                        if (animStyle === 'highlight') {
                            const revealFrame = (i / words.length) * (phaseA * 0.8);
                            const isRevealed = frame >= revealFrame;
                            
                            if (isRevealed) {
                                finalColor = highlight ? G.textWhite : '#D1D1D6';
                                fontWeight = highlight ? 700 : 400;
                                textShadow = highlight ? `0 0 20px ${accent}40` : 'none';
                            } else {
                                finalColor = G.textMuted;
                                finalOpacity = 0.4;
                            }
                        }

                        return (
                            <span key={i} style={{ 
                                color: finalColor, 
                                opacity: finalOpacity, 
                                transition: 'color 0.2s, opacity 0.2s',
                                fontWeight: fontWeight,
                                textShadow: textShadow
                            }}>
                                {cleanWord}{' '}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* --- DIAGRAM (BOTTOM ZONE) --- */}
            {hasDiagram && (
                <div style={{
                    position: 'absolute',
                    top: '45%', bottom: 120, left: 60, right: 60,
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

            {/* --- WATERMARK --- */}
            <div style={{ 
                position: 'absolute', 
                bottom: 40, right: 60, 
                textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            }}>
                <div style={{
                    fontSize: '12px', fontWeight: 700, color: G.textMuted,
                    letterSpacing: '3px', textTransform: 'uppercase',
                    opacity: 0.8
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '10px', fontWeight: 500, color: G.textMuted, 
                    letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px',
                    opacity: 0.5
                }}>
                    Hemanth Vasi
                </div>
            </div>

            {/* --- PROGRESS BAR (FULL WIDTH) --- */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '8px', backgroundColor: G.border }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: accent }} />
            </div>
        </AbsoluteFill>
    );
};
