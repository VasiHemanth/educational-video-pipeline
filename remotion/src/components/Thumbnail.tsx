import React from 'react';
import { AbsoluteFill, useVideoConfig, Img, staticFile } from 'remotion';
import { Brain } from 'lucide-react';
import { VideoProps } from '../types';
import { NativeDiagram } from './NativeDiagram';

// ── Background Wall Component ──────────────────────────────────────────────────
const IconBackgroundWall: React.FC<{ diagrams: VideoProps['diagrams'] }> = ({ diagrams }) => {
    // Extract unique icon names from all diagrams, limit to 3 max
    const uniqueIcons = Array.from(new Set(
        diagrams?.flatMap(d => {
            if (!d.dsl) return [];
            const parsed = typeof d.dsl === 'string' ? JSON.parse(d.dsl) : d.dsl;
            return parsed.nodes?.map((n: any) => n.iconName)
                .filter(Boolean)
                .filter((name: string) => name !== 'user' && name !== 'database') || [];
        }) || []
    )).slice(0, 3) as string[];

    const hasNoIcons = uniqueIcons.length === 0;
    const iconsToRender = hasNoIcons ? ['brain', 'brain', 'brain'] : uniqueIcons;

    // Map exactly to 3 positions: Top Right, Bottom Left, Top Left
    const scatterParams = iconsToRender.map((iconName, i) => {
        let left, top, size, opacity, rotate;
        if (i === 0) {
            // Top Left
            left = '10%'; top = '15%'; size = '500px'; opacity = 0.15; rotate = '-15deg';
        } else if (i === 1) {
            // Top Right
            left = '90%'; top = '20%'; size = '600px'; opacity = 0.12; rotate = '10deg';
        } else {
            // Bottom Left
            left = '15%'; top = '85%'; size = '450px'; opacity = 0.18; rotate = '20deg';
        }

        return {
            iconName,
            id: `bg-icon-${i}`,
            left, top, size, opacity, rotate
        };
    });

    return (
        <AbsoluteFill style={{ overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
            {scatterParams.map((p) => {
                const style = {
                    position: 'absolute' as const,
                    left: p.left,
                    top: p.top,
                    width: p.size,
                    height: p.size,
                    opacity: p.opacity,
                    transform: `translate(-50%, -50%) rotate(${p.rotate})`
                };

                if (hasNoIcons) {
                    return (
                        <div key={p.id} style={style}>
                            <Brain size="100%" color="#4285F4" strokeWidth={1} />
                        </div>
                    );
                }

                return (
                    <Img
                        key={p.id}
                        src={staticFile(`icons/gcp/${p.iconName.toLowerCase().replace(/[-\s]+/g, '_')}.svg`)}
                        style={style}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                    />
                );
            })}
        </AbsoluteFill>
    );
};

const G = {
    blue: '#2997FF', purple: '#BF5AF2', orange: '#FF9F0A',
    bg: '#0A0A0A', textWhite: '#F5F5F7', textMuted: '#86868B',
};

export const Thumbnail: React.FC<VideoProps> = ({ content, diagrams, config }) => {

    const headline = config?.thumbnail_headline || content?.topic || "Cloud Architecture";
    const subheadline = config?.thumbnail_subheadline || content?.question_text || "";
    const domain = content?.domain || 'Generative AI';

    // Get the first diagram to show a preview
    const firstDiagram = diagrams?.find(d => d.dsl);

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg,
            fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            padding: '80px 60px'
        }}>
            {/* 1. SVG BACKGROUND WALL */}
            <IconBackgroundWall diagrams={diagrams} />

            {/* 2. AMBIENT GLOWS */}
            <div style={{ position: 'absolute', top: '0%', left: '0%', width: '100%', height: '50%', background: `radial-gradient(circle at top left, ${G.purple}25, transparent 70%)`, filter: 'blur(100px)' }} />
            <div style={{ position: 'absolute', bottom: '0%', right: '0%', width: '100%', height: '50%', background: `radial-gradient(circle at bottom right, ${G.blue}20, transparent 70%)`, filter: 'blur(120px)' }} />

            {/* 3. TOP INFO */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 10 }}>
                <div style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: G.blue,
                    letterSpacing: '8px',
                    textTransform: 'uppercase'
                }}>
                    {domain}
                </div>
                <div style={{ height: '6px', width: '160px', backgroundColor: G.blue }} />
            </div>

            {/* 4. MAIN HEADLINE (CENTERED) */}
            <div style={{
                position: 'relative',
                marginTop: '120px',
                display: 'flex',
                flexDirection: 'column',
                gap: '40px',
                zIndex: 10
            }}>
                <div style={{
                    fontSize: '120px',
                    fontWeight: 900,
                    color: G.textWhite,
                    lineHeight: 1.0,
                    letterSpacing: '-5px',
                    textShadow: '0 20px 50px rgba(0,0,0,0.8)'
                }}>
                    {headline}
                </div>
                <div style={{
                    fontSize: '44px',
                    fontWeight: 500,
                    color: G.textMuted,
                    lineHeight: 1.4,
                    maxWidth: '900px'
                }}>
                    {subheadline}
                </div>
            </div>

            {/* 5. FLOATING DIAGRAM PREVIEW (CENTERED LOWER) */}
            {firstDiagram?.dsl && (
                <div style={{
                    position: 'relative',
                    marginTop: '100px',
                    width: '100%',
                    height: '600px',
                    background: 'rgba(28, 28, 30, 0.4)',
                    backdropFilter: 'blur(30px)',
                    borderRadius: '50px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    padding: '40px',
                    boxShadow: '0 60px 100px rgba(0,0,0,0.7)',
                    transform: 'perspective(1200px) rotateX(10deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    zIndex: 5
                }}>
                    <div style={{ transform: 'scale(0.85)', width: '1000px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <NativeDiagram dsl={firstDiagram.dsl} accent={G.blue} phaseA={-1000} phaseB={0} />
                    </div>
                    {/* Glass Overlay Label */}
                    <div style={{
                        position: 'absolute',
                        top: '30px',
                        left: '40px',
                        fontSize: '22px',
                        fontWeight: 700,
                        color: G.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '3px'
                    }}>
                        Architecture Preview
                    </div>
                </div>
            )}

            {/* 6. BRANDING (STICKY BOTTOM) */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                left: '60px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                zIndex: 10
            }}>
                <div style={{
                    width: '80px', height: '80px', backgroundColor: G.textWhite, borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 900, color: G.bg
                }}>
                    HV
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: G.textWhite, letterSpacing: '3px', textTransform: 'uppercase' }}>
                        AI Cloud Architect
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 500, color: G.textMuted, letterSpacing: '1px' }}>
                        by Hemanth Vasi
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};
