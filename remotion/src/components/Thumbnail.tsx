import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoProps } from '../types';
import { NativeDiagram } from './NativeDiagram';

const G = {
    blue: '#2997FF', purple: '#BF5AF2', orange: '#FF9F0A',
    bg: '#0A0A0A', textWhite: '#F5F5F7', textMuted: '#86868B',
};

export const Thumbnail: React.FC<VideoProps> = ({ content, diagrams, config }) => {
    const { width, height } = useVideoConfig();
    const accent = G.blue;

    const headline = config?.thumbnail_headline || content?.topic || "Cloud Architecture";
    const subheadline = config?.thumbnail_subheadline || content?.question_text || "";
    const questionNum = content?.question_number || "5";
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
            {/* 1. ULTRA LARGE BACKGROUND QUESTION NUMBER */}
            <div style={{
                position: 'absolute',
                top: '40%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1200px',
                fontWeight: 900,
                color: '#FFF',
                opacity: 0.04,
                lineHeight: 1,
                userSelect: 'none',
                pointerEvents: 'none',
                letterSpacing: '-20px'
            }}>
                {questionNum}
            </div>

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
                    <div style={{ transform: 'scale(0.7)', width: '1000px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <NativeDiagram dsl={firstDiagram.dsl} accent={G.blue} phaseA={0} phaseB={0} />
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
