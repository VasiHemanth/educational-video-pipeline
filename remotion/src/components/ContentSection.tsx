import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AnswerSection, DiagramInfo } from '../types';

const G = {
    blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04', green: '#34A853',
    bg: '#0D1117', surface: '#161B22', border: '#30363D',
    textWhite: '#E6EDF3', textMuted: '#8B949E',
};

const ACCENTS = [G.blue, G.red, G.green, G.yellow];

function colorWord(rawWord: string, keywords: AnswerSection['keywords']): { color: string; bold: boolean; cleanWord: string } {
    const cleanWord = rawWord.replace(/\*/g, ''); // Strip markdown asterisks completely
    const clean = cleanWord.replace(/[.,;:!?'"()]/g, '').toLowerCase();
    if (keywords?.tech_terms?.some(k => clean.includes(k.toLowerCase()))) return { color: G.blue, bold: true, cleanWord };
    if (keywords?.action_verbs?.some(k => clean === k.toLowerCase())) return { color: G.red, bold: true, cleanWord };
    if (keywords?.concepts?.some(k => clean.includes(k.toLowerCase()))) return { color: G.green, bold: true, cleanWord };
    return { color: G.textWhite, bold: false, cleanWord };
}

const Corners: React.FC<{ color: string }> = ({ color }) => {
    const size = 48;
    const t = 4;
    const style = (top: boolean, left: boolean): React.CSSProperties => ({
        position: 'absolute', width: size, height: size,
        top: top ? 24 : undefined, bottom: top ? undefined : 24,
        left: left ? 24 : undefined, right: left ? undefined : 24,
        borderTop: top ? `${t}px solid ${color}` : 'none',
        borderBottom: !top ? `${t}px solid ${color}` : 'none',
        borderLeft: left ? `${t}px solid ${color}` : 'none',
        borderRight: !left ? `${t}px solid ${color}` : 'none',
        borderRadius: top && left ? '4px 0 0 0' : top && !left ? '0 4px 0 0' : !top && left ? '0 0 0 4px' : '0 0 4px 0',
    });
    return (
        <>
            <div style={style(true, true)} />
            <div style={style(true, false)} />
            <div style={style(false, true)} />
            <div style={style(false, false)} />
        </>
    );
};

export const ContentSection: React.FC<{
    section: AnswerSection;
    diagram?: DiagramInfo;
    sectionIndex?: number;
    config?: import('../types').VideoProps['config'];
}> = ({ section, diagram, sectionIndex = 0, config }) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();

    const hasDiagram = !!(diagram && diagram.pngPath);
    const accent = ACCENTS[sectionIndex % ACCENTS.length];

    const animStyle = config?.animStyle || 'highlight';

    // For 'fade', we use a CSS opacity transition on the container
    // For 'highlight', the container is always 1, keywords light up sequentially
    // For 'type', container is 1, words appear sequentially
    const containerOpacity = animStyle === 'fade'
    const words = section.text?.split(' ') || [];

    // Grab pre-calculated timings from JSON payload (fallback if missing during local preview)
    const secTiming = config?.sectionTimings?.find(s => s.id === section.id);
    const phaseA = secTiming ? secTiming.phaseAFrames : words.length * 4;
    const phaseB = secTiming ? secTiming.phaseBFrames : 15;

    // Typewriter logic: force exactly [phaseA] frames to reveal the entire string
    const typeRate = phaseA / Math.max(1, words.length);
    const wordsToReveal = Math.min(words.length, Math.floor(frame / typeRate) + 1);

    // Phase C: Diagram Entry delays until Text (A) + Pause (B) are complete
    const diagramStartFrame = phaseA + phaseB;
    const diagramSpring = spring({ fps, frame: frame - diagramStartFrame, config: { damping: 80, stiffness: 60 } });
    const diagramY = interpolate(diagramSpring, [0, 1], [150, 0]);

    const baseFontSize = hasDiagram ? 46 : 56;
    const fontSize = words.length > 70 ? baseFontSize - 8 : baseFontSize;

    const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg, fontFamily: 'Roboto, Arial, sans-serif',
            opacity: containerOpacity, overflow: 'hidden',
        }}>
            <Corners color={accent} />

            {/* --- TITLE --- */}
            <div style={{ position: 'absolute', top: 180, left: 0, right: 0, height: '100px', textAlign: 'center' }}>
                <div style={{ fontSize: '56px', fontWeight: 700, color: G.textWhite }}>✦ {section.title} ✦</div>
                <div style={{ width: '120px', height: '6px', backgroundColor: accent, borderRadius: '3px', margin: '12px auto 0' }} />
            </div>

            {/* --- TEXT (TOP ZONE) --- */}
            <div style={{
                position: 'absolute',
                top: 260,
                left: 60, right: 60,
                height: hasDiagram ? '35%' : '75%', // Dynamic zone boundary
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    fontSize: `${fontSize}px`, lineHeight: 1.6,
                    textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal',
                    width: '100%',
                }}>
                    {words.map((word, i) => {
                        // Typewriter logic: filter out unrevealed words
                        if (animStyle === 'type' && i >= wordsToReveal) return null;

                        const { color, bold, cleanWord } = colorWord(word, section.keywords);
                        const isKeyword = bold || color !== G.textWhite;

                        // Highlight logic: sweeping spotlight effect
                        let finalColor = color;
                        let finalOpacity = 1;
                        if (animStyle === 'highlight') {
                            const revealFrame = (i / words.length) * 60;
                            const isRevealed = frame >= revealFrame;
                            if (isKeyword) {
                                finalColor = isRevealed ? color : G.textMuted;
                                finalOpacity = isRevealed ? 1 : 0.8;
                            } else {
                                finalColor = G.textWhite;
                                finalOpacity = 0.8;
                            }
                        }

                        return (
                            <span key={i} style={{ color: finalColor, fontWeight: bold ? 700 : 400, opacity: finalOpacity }}>
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
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    transform: `translateY(${diagramY}px)`,
                    opacity: interpolate(diagramSpring, [0, 1], [0, 1]),
                }}>
                    <Img
                        src={diagram!.pngPath}
                        style={{
                            maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                            borderRadius: '20px', border: `2px solid ${accent}40`,
                            backgroundColor: '#FFFFFF', padding: '12px',
                        }}
                    />
                </div>
            )}

            {/* --- COMPONENT BOTTOM --- */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '6px', backgroundColor: G.border }}>
                <div style={{ width: `${progress}%`, height: '100%', backgroundColor: accent, borderRadius: '0 3px 3px 0' }} />
            </div>

            <div style={{
                position: 'absolute', bottom: '20px', right: '50px',
                textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
            }}>
                <div style={{
                    fontSize: '20px', color: G.textMuted, opacity: 0.5,
                    fontFamily: "'Dancing Script', cursive, serif", lineHeight: 1,
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '10px', fontWeight: 700, color: G.textMuted, opacity: 0.3,
                    letterSpacing: '1px', textTransform: 'uppercase', marginTop: '2px',
                }}>
                    by Hemanth Vasi
                </div>
            </div>
        </AbsoluteFill>
    );
};
