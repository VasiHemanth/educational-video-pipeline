import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { VideoProps } from './types';

const G = {
    blue: '#2997FF', purple: '#BF5AF2', orange: '#FF9F0A',
    bg: '#0A0A0A', textWhite: '#F5F5F7', textMuted: '#86868B',
};

export const Thumbnail: React.FC<VideoProps> = ({ content, config }) => {
    const { width, height } = useVideoConfig();
    const accent = G.orange; // Use a consistent, vibrant accent for thumbnails

    // Use metadata if available, fallback to main content
    const headline = content?.config?.thumbnail_headline || content?.topic || "Cloud Architecture";
    const subheadline = content?.config?.thumbnail_subheadline || content?.question_text || "";

    return (
        <AbsoluteFill style={{
            backgroundColor: G.bg,
            fontFamily: "'Inter', '-apple-system', 'SF Pro Display', sans-serif",
            overflow: 'hidden',
            padding: '80px',
        }}>
            {/* Background Glows */}
            <div style={{ position: 'absolute', top: '-20%', left: '-20%', width: '100%', height: '100%', background: `radial-gradient(circle, ${G.purple}20, transparent 60%)`, filter: 'blur(120px)' }} />
            <div style={{ position: 'absolute', bottom: '-20%', right: '-20%', width: '100%', height: '100%', background: `radial-gradient(circle, ${G.blue}20, transparent 60%)`, filter: 'blur(120px)' }} />

            {/* Top Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: G.textMuted, letterSpacing: '2px', textTransform: 'uppercase' }}>
                    {content?.domain || 'Generative AI'}
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: accent, background: `${accent}20`, padding: '8px 24px', borderRadius: '16px' }}>
                    Q#{content?.question_number}
                </div>
            </div>

            {/* Main Headline */}
            <div style={{
                position: 'absolute',
                top: '25%', left: '80px', right: '80px',
                fontSize: 110,
                fontWeight: 800,
                color: G.textWhite,
                lineHeight: 1.2,
                letterSpacing: '-3px',
                textAlign: 'center'
            }}>
                {headline}
            </div>

            {/* Sub-headline / Question */}
            <div style={{
                position: 'absolute',
                top: '55%', left: '80px', right: '80px',
                fontSize: 44,
                fontWeight: 500,
                color: G.textMuted,
                lineHeight: 1.5,
                textAlign: 'center',
                maxHeight: '20%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {subheadline}
            </div>

            {/* Bottom Branding */}
            <div style={{ position: 'absolute', bottom: 80, left: 80, right: 80, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                    fontSize: 24, fontWeight: 600, color: G.textMuted,
                    letterSpacing: '4px', textTransform: 'uppercase',
                }}>
                    AI Cloud Architect <span style={{ color: accent }}>/</span> Hemanth Vasi
                </div>
            </div>
        </AbsoluteFill>
    );
};
