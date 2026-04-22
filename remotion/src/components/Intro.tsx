import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { VideoProps, DesignProps } from '../types';
import { mergeDesign } from '../designDefaults';
import React from 'react';

export const Intro: React.FC<{
    content: VideoProps['content'];
    config?: VideoProps['config'];
    design?: DesignProps;
}> = ({ content, config, design: rawDesign }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const d = mergeDesign(rawDesign);
    const p = d.palette;
    const t = d.typography;
    const anim = d.animations.intro;

    // ── Animation helpers based on design.animations.intro.type ──
    const introSpring = spring({ fps, frame, config: { damping: anim.spring.damping, stiffness: anim.spring.stiffness } });
    const questionSpring = spring({ fps, frame: frame - 30, config: { damping: 60, stiffness: 80 } });
    const brandFade = interpolate(frame, [60, 100], [0, 1], { extrapolateRight: 'clamp' });

    // Glow pulse
    const glow = Math.sin(frame / 18) * 0.3 + d.effects.glowIntensity;

    // Title text
    const titleText = content.title_card_text || content.topic;
    const hookOrQuestion = config?.useHook ? (content.hook_text || content.question_text) : content.question_text;

    // ── Intro animation variants ──
    const getTitleTransform = () => {
        switch (anim.type) {
            case 'slide-up':
                return {
                    transform: `translateY(${interpolate(introSpring, [0, 1], [40, 0])}px)`,
                    opacity: introSpring,
                };
            case 'scale-in':
                return {
                    transform: `scale(${interpolate(introSpring, [0, 1], [0.8, 1])})`,
                    opacity: introSpring,
                };
            case 'blur-in': {
                const blur = interpolate(introSpring, [0, 1], [20, 0]);
                return {
                    filter: `blur(${blur}px)`,
                    opacity: introSpring,
                };
            }
            case 'stagger-chars':
            case 'typewriter':
                return { opacity: 1 };
            default:
                return {
                    transform: `translateY(${interpolate(introSpring, [0, 1], [40, 0])}px)`,
                    opacity: introSpring,
                };
        }
    };

    // Character-level rendering for stagger-chars / typewriter
    const renderTitle = () => {
        if (anim.type === 'stagger-chars') {
            const delay = anim.staggerDelay || 2;
            return (
                <span>
                    {titleText.split('').map((char, i) => {
                        const charSpring = spring({ fps, frame: frame - (i * delay), config: { damping: anim.spring.damping, stiffness: anim.spring.stiffness } });
                        return (
                            <span key={i} style={{
                                display: 'inline-block',
                                opacity: charSpring,
                                transform: `translateY(${interpolate(charSpring, [0, 1], [20, 0])}px)`,
                            }}>
                                {char === ' ' ? '\u00A0' : char}
                            </span>
                        );
                    })}
                </span>
            );
        }
        if (anim.type === 'typewriter') {
            const delay = anim.staggerDelay || 2;
            const charsVisible = Math.min(titleText.length, Math.floor(frame / delay));
            return <span>{titleText.slice(0, charsVisible)}<span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span></span>;
        }
        return <span>{titleText}</span>;
    };

    const titleStyle = getTitleTransform();

    // ── Background effects ──
    const renderBackground = () => {
        if (d.effects.backgroundType === 'none') return null;
        const colors = d.effects.glowColors.length > 0 ? d.effects.glowColors : p.gradients.introGlow;
        const positions = [
            { top: '-10%', left: '-10%' },
            { bottom: '-10%', right: '-10%' },
            { top: '30%', left: '50%', transform: 'translateX(-50%)' },
        ];
        return colors.map((color, i) => (
            <div key={i} style={{
                position: 'absolute',
                ...positions[i % positions.length],
                width: '800px', height: '800px',
                background: `radial-gradient(circle, ${color}, transparent 60%)`,
                opacity: glow * (1 - i * 0.1),
                filter: `blur(${d.effects.glowBlur}px)`,
                pointerEvents: 'none',
            }} />
        ));
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: p.background,
            justifyContent: 'center',
            alignItems: 'center',
            padding: '60px',
            overflow: 'hidden',
            fontFamily: t.fontFamily,
        }}>
            {renderBackground()}

            {/* SVG background assets */}
            {d.svgAssets?.filter(a => a.placement === 'background').map(asset => (
                <div key={asset.id} style={{
                    position: 'absolute', inset: 0, opacity: asset.opacity, pointerEvents: 'none',
                }} dangerouslySetInnerHTML={{ __html: asset.svg }} />
            ))}

            {/* TOP INFO ZONE */}
            <div style={{
                position: 'absolute',
                top: d.layout.introTextTop,
                width: '100%',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '0 80px',
            }}>
                <div style={{
                    ...titleStyle,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    marginBottom: '30px',
                }}>
                    {/* Domain badge */}
                    <div style={{
                        fontSize: `${t.labelSize + 10}px`,
                        fontWeight: 700,
                        color: p.primary,
                        letterSpacing: '4px',
                        textTransform: 'uppercase',
                        marginBottom: '16px',
                    }}>
                        {content.domain || 'GCP'}
                    </div>

                    {/* Title — scroll-stopper */}
                    <div style={{
                        fontSize: '52px',
                        fontWeight: t.titleWeight,
                        color: p.text,
                        letterSpacing: '-1px',
                        lineHeight: 1.15,
                        textAlign: 'center',
                        maxWidth: '900px',
                        textShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    }}>
                        {renderTitle()}
                    </div>

                    {/* Question number */}
                    <div style={{
                        fontSize: '26px',
                        fontWeight: 500,
                        color: p.textMuted,
                        marginTop: '14px',
                        letterSpacing: '1px',
                    }}>
                        Interview Q#{content.question_number}
                    </div>
                </div>

                {/* Hook / Question text */}
                <div style={{
                    width: '100%', maxWidth: '900px',
                    transform: `translateY(${interpolate(questionSpring, [0, 1], [40, 0])}px)`,
                    opacity: Math.max(0, questionSpring),
                    textAlign: 'center',
                }}>
                    <div style={{
                        fontSize: `${config?.useHook ? t.hookSize : t.titleSize + 8}px`,
                        fontWeight: 600,
                        color: p.text,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        whiteSpace: 'normal',
                        textShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    }}>
                        {hookOrQuestion}
                    </div>
                </div>
            </div>

            {/* SVG overlay assets */}
            {d.svgAssets?.filter(a => a.placement === 'overlay').map(asset => (
                <div key={asset.id} style={{
                    position: 'absolute', inset: 0, opacity: asset.opacity, pointerEvents: 'none',
                }} dangerouslySetInnerHTML={{ __html: asset.svg }} />
            ))}

            {/* Branding */}
            <div style={{
                position: 'absolute', bottom: '100px', width: '100%', textAlign: 'center',
                opacity: brandFade,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
                <div style={{
                    fontSize: '18px', fontWeight: 700, color: p.textMuted,
                    letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.8,
                }}>
                    AI Cloud Architect
                </div>
                <div style={{
                    fontSize: '14px', fontWeight: 500, color: p.textMuted,
                    letterSpacing: '2px', textTransform: 'uppercase', marginTop: '8px', opacity: 0.5,
                }}>
                    Hemanth Vasi
                </div>
            </div>
        </AbsoluteFill>
    );
};
