import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProps } from '../types';

const G = {
    blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04', green: '#34A853',
    bg: '#0D1117', surface: '#161B22', textWhite: '#E6EDF3', textMuted: '#8B949E',
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
            backgroundColor: G.bg, justifyContent: 'flex-start', alignItems: 'center',
            padding: '180px 60px 60px 60px', overflow: 'hidden', fontFamily: 'Roboto, Arial, sans-serif',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '-20%', left: '0%', width: '600px', height: '600px',
                borderRadius: '50%', background: `radial-gradient(circle, ${G.blue}25, transparent 70%)`,
                opacity: glow, filter: 'blur(90px)', pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-5%', width: '500px', height: '500px',
                borderRadius: '50%', background: `radial-gradient(circle, ${G.green}20, transparent 70%)`,
                opacity: glow * 0.8, filter: 'blur(80px)', pointerEvents: 'none',
            }} />

            {/* Corner decorations */}
            {([[true, true], [true, false], [false, true], [false, false]] as [boolean, boolean][]).map(([top, left], i) => (
                <div key={i} style={{
                    position: 'absolute', width: 56, height: 56,
                    top: top ? 32 : undefined, bottom: top ? undefined : 32,
                    left: left ? 32 : undefined, right: left ? undefined : 32,
                    borderTop: top ? `4px solid ${[G.blue, G.red, G.green, G.yellow][i]}` : 'none',
                    borderBottom: !top ? `4px solid ${[G.blue, G.red, G.green, G.yellow][i]}` : 'none',
                    borderLeft: left ? `4px solid ${[G.blue, G.red, G.green, G.yellow][i]}` : 'none',
                    borderRight: !left ? `4px solid ${[G.blue, G.red, G.green, G.yellow][i]}` : 'none',
                }} />
            ))}

            {/* Badge */}
            <div style={{
                transform: `translateY(${interpolate(titleSlide, [0, 1], [-80, 0])}px)`,
                opacity: titleSlide, textAlign: 'center', marginTop: '40px',
            }}>
                <div style={{ fontSize: '40px', fontWeight: 500, color: G.textMuted, letterSpacing: '6px', textTransform: 'uppercase' }}>
                    {content.domain || 'Cloud'}
                </div>
                <div style={{ fontSize: '72px', fontWeight: 900, color: G.textWhite, letterSpacing: '2px', marginTop: '8px' }}>
                    Interview Q#{content.question_number}
                </div>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '14px' }}>
                    {[G.blue, G.red, G.yellow, G.green].map((c, i) => (
                        <div key={i} style={{ width: '52px', height: '4px', backgroundColor: c, borderRadius: '2px' }} />
                    ))}
                </div>
            </div>

            {/* Question / Hook card */}
            <div style={{
                marginTop: '50px', width: '100%', maxWidth: '940px', padding: '36px 44px',
                backgroundColor: G.surface, borderRadius: '20px',
                border: `1px solid ${G.blue}30`,
                transform: `translateY(${interpolate(questionSlide, [0, 1], [60, 0])}px)`,
                opacity: Math.max(0, questionSlide),
            }}>
                <div style={{
                    fontSize: config?.useHook ? '64px' : '48px',
                    fontWeight: 400, color: G.textWhite, lineHeight: 1.5,
                    textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal',
                }}>
                    {config?.useHook ? (content.hook_text || content.question_text) : content.question_text}
                </div>
            </div>

            {/* Branding */}
            <div style={{
                position: 'absolute', bottom: '70px', width: '100%', textAlign: 'center', opacity: brandFade,
            }}>
                <div style={{ fontSize: '42px', fontFamily: "'Dancing Script', cursive, serif", color: G.blue }}>
                    AI Cloud Architect
                </div>
                <div style={{ fontSize: '22px', fontWeight: 700, color: G.textMuted, letterSpacing: '3px', textTransform: 'uppercase' }}>
                    by Hemanth Vasi
                </div>
            </div>
        </AbsoluteFill>
    );
};
