import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const G = {
    blue: '#4285F4', red: '#EA4335', yellow: '#FBBC04', green: '#34A853',
    bg: '#0D1117', surface: '#161B22', textWhite: '#E6EDF3', textMuted: '#8B949E',
};

import { VideoProps } from '../types';

export const Outro: React.FC<{ content?: VideoProps['content'] }> = ({ content }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const thanksFade = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
    const brandSlide = spring({ fps, frame: frame - 25, config: { damping: 60 } });
    const ctaScale = spring({ fps, frame: frame - 60, config: { damping: 12, stiffness: 80 } });
    const ctaPulse = 1 + Math.sin(frame / 10) * 0.03;
    const emojiFade = interpolate(frame, [90, 120], [0, 1], { extrapolateRight: 'clamp' });
    const glow = Math.sin(frame / 18) * 0.3 + 0.7;

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg, justifyContent: 'center', alignItems: 'center',
            padding: '180px 60px 60px 60px',
            fontFamily: 'Roboto, Arial, sans-serif', overflow: 'hidden',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '20%', left: '50%', width: '700px', height: '700px',
                borderRadius: '50%', transform: 'translate(-50%, -50%)',
                background: `radial-gradient(circle, ${G.blue}18, transparent 70%)`,
                opacity: glow, filter: 'blur(100px)', pointerEvents: 'none',
            }} />

            {/* Corner decorations */}
            {([[true, true, G.blue], [true, false, G.red], [false, true, G.green], [false, false, G.yellow]] as [boolean, boolean, string][]).map(([top, left, color], i) => (
                <div key={i} style={{
                    position: 'absolute', width: 56, height: 56,
                    top: top ? 32 : undefined, bottom: top ? undefined : 32,
                    left: left ? 32 : undefined, right: left ? undefined : 32,
                    borderTop: top ? `4px solid ${color}` : 'none',
                    borderBottom: !top ? `4px solid ${color}` : 'none',
                    borderLeft: left ? `4px solid ${color}` : 'none',
                    borderRight: !left ? `4px solid ${color}` : 'none',
                }} />
            ))}

            {/* Thanks / CTA */}
            <div style={{ opacity: thanksFade, textAlign: 'center', fontSize: '48px', fontWeight: 700, color: G.textWhite, padding: '0 80px' }}>
                {content?.cta_text || 'Thanks For Watching! 🙏'}
            </div>

            <div style={{
                marginTop: '48px', textAlign: 'center',
                transform: `translateY(${interpolate(brandSlide, [0, 1], [50, 0])}px)`,
                opacity: Math.max(0, brandSlide),
            }}>
                <div style={{
                    fontSize: '50px', fontFamily: "'Dancing Script', cursive, serif", color: G.blue,
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '26px', fontWeight: 700, color: G.textMuted,
                    letterSpacing: '4px', textTransform: 'uppercase', marginTop: '6px',
                }}>
                    by Hemanth Vasi
                </div>
            </div>

            {/* SUBSCRIBE CTA */}
            <div style={{
                marginTop: '64px',
                transform: `scale(${ctaScale * ctaPulse})`,
            }}>
                <div style={{
                    padding: '20px 64px', backgroundColor: G.red, borderRadius: '50px',
                    fontSize: '36px', fontWeight: 700, color: '#FFF',
                    boxShadow: `0 8px 32px ${G.red}50`,
                    display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                    🔔 SUBSCRIBE
                </div>
            </div>

            {/* Emoji row */}
            <div style={{
                marginTop: '36px', fontSize: '50px', display: 'flex', gap: '40px',
                opacity: emojiFade,
            }}>
                <span>👍</span><span>💬</span><span>↗️</span>
            </div>

            {/* Google color bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '6px', display: 'flex' }}>
                {[G.blue, G.red, G.yellow, G.green].map((c, i) => (
                    <div key={i} style={{ flex: 1, backgroundColor: c }} />
                ))}
            </div>
        </AbsoluteFill>
    );
};
