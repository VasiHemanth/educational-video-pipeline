import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProps } from '../types';

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

export const Intro: React.FC<{ content: VideoProps['content'], config?: VideoProps['config'] }> = ({ content, config }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const titleSlide = spring({ fps, frame, config: { damping: 80, stiffness: 100 } });
    const questionSlide = spring({ fps, frame: frame - 30, config: { damping: 60, stiffness: 80 } });
    const brandFade = interpolate(frame, [60, 100], [0, 1], { extrapolateRight: 'clamp' });
    const glow = Math.sin(frame / 18) * 0.3 + 0.7;

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg, justifyContent: 'center', alignItems: 'center',
            padding: '60px', overflow: 'hidden',
            fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
        }}>
            {/* Ambient glows (Colorful Apple Event Style) */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%', width: '800px', height: '800px',
                background: `radial-gradient(circle, ${G.purple}20, transparent 60%)`,
                opacity: glow, filter: 'blur(100px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-10%', width: '800px', height: '800px',
                background: `radial-gradient(circle, ${G.blue}20, transparent 60%)`,
                opacity: glow * 0.9, filter: 'blur(100px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px',
                background: `radial-gradient(circle, ${G.orange}15, transparent 60%)`,
                opacity: glow * 0.8, filter: 'blur(90px)', pointerEvents: 'none',
            }} />

            {/* TOP INFO ZONE (20-45%) — starts at 20% to clear Instagram top chrome */}
            <div style={{
                position: 'absolute',
                top: '20%',
                width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0 80px'
            }}>
                <div style={{
                    transform: `translateY(${interpolate(titleSlide, [0, 1], [40, 0])}px)`,
                    opacity: titleSlide,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        fontSize: '36px', fontWeight: 700, color: G.blue,
                        letterSpacing: '4px', textTransform: 'uppercase'
                    }}>
                        {content.domain || 'Architecture'}
                    </div>
                    <div style={{
                        fontSize: '56px', fontWeight: 800, color: G.textWhite,
                        letterSpacing: '-1.5px', marginTop: '12px'
                    }}>
                        Question {content.question_number}
                    </div>
                </div>

                {/* Question / Hook text */}
                <div style={{
                    width: '100%', maxWidth: '900px',
                    transform: `translateY(${interpolate(questionSlide, [0, 1], [40, 0])}px)`,
                    opacity: Math.max(0, questionSlide),
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: config?.useHook ? '64px' : '48px', // Reduced from 72/56
                        fontWeight: 600, color: G.textWhite, lineHeight: 1.3,
                        wordBreak: 'break-word', whiteSpace: 'normal',
                        textShadow: '0 10px 30px rgba(0,0,0,0.5)'
                    }}>                        {config?.useHook ? (content.hook_text || content.question_text) : content.question_text}
                    </div>
                </div>
            </div>

            {/* Branding (Bottom Safe Zone) */}
            <div style={{
                position: 'absolute', bottom: '100px', width: '100%', textAlign: 'center', opacity: brandFade,
                display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}>
                <div style={{
                    fontSize: '18px', fontWeight: 700, color: G.textMuted,
                    letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.8
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '14px', fontWeight: 500, color: G.textMuted,
                    letterSpacing: '2px', textTransform: 'uppercase', marginTop: '8px', opacity: 0.5
                }}>
                    Hemanth Vasi
                </div>
            </div>
        </AbsoluteFill>
    );
};
