import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProps } from '../types';

const G = {
    blue: '#2997FF', // Apple-esque bright blue
    bg: '#0A0A0A', // Deep pure dark
    surface: '#1C1C1E',
    border: '#333336',
    textWhite: '#F5F5F7',
    textMuted: '#86868B',
};

export const Outro: React.FC<{ content?: VideoProps['content'] }> = ({ content }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const thanksFade = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
    const brandSlide = spring({ fps, frame: frame - 25, config: { damping: 60 } });
    const ctaScale = spring({ fps, frame: frame - 60, config: { damping: 12, stiffness: 80 } });
    const ctaPulse = 1 + Math.sin(frame / 15) * 0.02;
    const glow = Math.sin(frame / 18) * 0.3 + 0.7;

    const isMeta = content?.config?.platform === 'meta';

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg, justifyContent: 'center', alignItems: 'center',
            padding: '60px',
            fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif", overflow: 'hidden',
        }}>
            {/* Ambient glow */}
            <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                width: '800px', height: '800px', borderRadius: '50%',
                background: `radial-gradient(circle, ${isMeta ? '#dc2743' : G.blue}15, transparent 60%)`,
                opacity: glow, filter: 'blur(100px)', pointerEvents: 'none',
            }} />

            {/* Thanks / CTA Text */}
            <div style={{ 
                opacity: thanksFade, textAlign: 'center', fontSize: '56px', 
                fontWeight: 700, color: G.textWhite, padding: '0 80px',
                lineHeight: 1.3
            }}>
                {content?.cta_text || 'Thanks For Watching'}
            </div>

            <div style={{
                marginTop: '60px', textAlign: 'center',
                transform: `translateY(${interpolate(brandSlide, [0, 1], [40, 0])}px)`,
                opacity: Math.max(0, brandSlide),
            }}>
                <div style={{
                    fontSize: '24px', fontWeight: 800, color: G.textMuted,
                    letterSpacing: '5px', textTransform: 'uppercase', opacity: 0.8
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '16px', fontWeight: 500, color: G.textMuted,
                    letterSpacing: '3px', textTransform: 'uppercase', marginTop: '12px', opacity: 0.5
                }}>
                    Hemanth Vasi
                </div>
            </div>

            {/* SUBSCRIBE CTA */}
            <div style={{
                marginTop: '80px',
                transform: `scale(${ctaScale * ctaPulse})`,
            }}>
                <div style={{
                    padding: '24px 64px',
                    background: isMeta ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' : G.textWhite,
                    borderRadius: '50px',
                    fontSize: '32px',
                    fontWeight: 700, 
                    color: isMeta ? '#FFF' : G.bg,
                    display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                    {isMeta ? 'Follow for more' : 'Subscribe'}
                </div>
            </div>
        </AbsoluteFill>
    );
};
