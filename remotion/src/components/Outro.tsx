import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProps, DesignProps } from '../types';
import { mergeDesign } from '../designDefaults';
import React from 'react';

export const Outro: React.FC<{
    content?: VideoProps['content'];
    design?: DesignProps;
}> = ({ content, design: rawDesign }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const d = mergeDesign(rawDesign);
    const p = d.palette;
    const t = d.typography;
    const outroAnim = d.animations.outro;

    const thanksFade = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: 'clamp' });
    const brandSlide = spring({ fps, frame: frame - 25, config: { damping: 60 } });
    const ctaSpring = spring({ fps, frame: frame - 60, config: { damping: outroAnim.spring.damping, stiffness: outroAnim.spring.stiffness } });
    const glow = Math.sin(frame / 18) * 0.3 + d.effects.glowIntensity;

    const isMeta = content?.config?.platform === 'meta';
    const ctaGradient = p.gradients.cta;

    // ── Outro animation variants ──
    const getCtaAnimation = () => {
        switch (outroAnim.type) {
            case 'expand-rings':
                return { transform: `scale(${ctaSpring})` };
            case 'zoom-reveal': {
                const scale = interpolate(ctaSpring, [0, 1], [0.5, 1]);
                return { transform: `scale(${scale})` };
            }
            case 'pulse-cta':
            default: {
                const pulse = 1 + Math.sin(frame / 15) * 0.02;
                return { transform: `scale(${ctaSpring * pulse})` };
            }
        }
    };

    const ctaAnimation = getCtaAnimation();

    // Expanding rings for 'expand-rings' outro type
    const renderRings = () => {
        if (outroAnim.type !== 'expand-rings') return null;
        return [0, 1, 2].map(i => {
            const ringSpring = spring({ fps, frame: frame - 40 - (i * 10), config: { damping: 30, stiffness: 40 } });
            const ringScale = interpolate(ringSpring, [0, 1], [0, 3 + i]);
            const ringOpacity = interpolate(ringSpring, [0, 1], [0.3, 0]);
            return (
                <div key={i} style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '200px', height: '200px',
                    border: `2px solid ${p.primary}`,
                    borderRadius: '50%',
                    transform: `translate(-50%, -50%) scale(${ringScale})`,
                    opacity: ringOpacity,
                    pointerEvents: 'none',
                }} />
            );
        });
    };

    const buttonBg = isMeta
        ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
        : ctaGradient.length >= 2
            ? `linear-gradient(45deg, ${ctaGradient[0]}, ${ctaGradient[1]})`
            : p.primary;

    const buttonShadow = isMeta
        ? '0 8px 40px rgba(220,39,67,0.4)'
        : `0 8px 40px ${p.primary}40`;

    return (
        <AbsoluteFill style={{
            backgroundColor: p.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            fontFamily: t.fontFamily,
            overflow: 'hidden',
        }}>
            {/* Background glow */}
            {d.effects.backgroundType !== 'none' && (
                <div style={{
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '800px', height: '800px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${isMeta ? '#dc274315' : `${p.primary}15`}, transparent 60%)`,
                    opacity: glow, filter: `blur(${d.effects.glowBlur}px)`, pointerEvents: 'none',
                }} />
            )}

            {renderRings()}

            {/* CTA Text */}
            <div style={{
                opacity: thanksFade, textAlign: 'center',
                fontSize: '56px', fontWeight: 700, color: p.text,
                padding: '0 80px', lineHeight: 1.3,
            }}>
                {content?.cta_text || 'Thanks For Watching'}
            </div>

            {/* Brand */}
            <div style={{
                marginTop: '60px', textAlign: 'center',
                transform: `translateY(${interpolate(brandSlide, [0, 1], [40, 0])}px)`,
                opacity: Math.max(0, brandSlide),
            }}>
                <div style={{
                    fontSize: '24px', fontWeight: 800, color: p.textMuted,
                    letterSpacing: '5px', textTransform: 'uppercase', opacity: 0.8,
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '16px', fontWeight: 500, color: p.textMuted,
                    letterSpacing: '3px', textTransform: 'uppercase', marginTop: '12px', opacity: 0.5,
                }}>
                    Hemanth Vasi
                </div>
            </div>

            {/* CTA Button */}
            <div style={{ marginTop: '80px', ...ctaAnimation }}>
                <div style={{
                    padding: '24px 64px',
                    background: buttonBg,
                    borderRadius: '50px',
                    fontSize: '32px', fontWeight: 800, color: '#FFF',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    letterSpacing: '0.5px',
                    boxShadow: buttonShadow,
                }}>
                    {isMeta ? 'FOLLOW + SAVE' : 'SUBSCRIBE'}
                </div>
            </div>
        </AbsoluteFill>
    );
};
