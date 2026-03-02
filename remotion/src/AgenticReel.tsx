import React from 'react';
import {
    AbsoluteFill,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Img,
    staticFile,
} from 'remotion';

export const AgenticReel: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();

    // 1. Background Gradient & Pan (Futuristic Navy)
    const bgPanX = interpolate(frame, [0, 300], [0, 10]);
    const bgPanY = interpolate(frame, [0, 300], [0, 15]);
    const bgStyle: React.CSSProperties = {
        background: `radial-gradient(circle at ${50 + bgPanX}% ${50 + bgPanY}%, #1a1a3e 0%, #0a0a1e 100%)`,
    };

    // 2. Animated Title "Agentic AI Workflows"
    // Spring entrance frames 0-60, scale 0 to 1
    const titleSpring = spring({
        frame,
        fps,
        config: {
            damping: 12,
            stiffness: 100,
        },
        durationInFrames: 60,
    });

    const titleOpacity = interpolate(frame, [0, 20], [0, 1]);

    // 3. Subtitle "GCP + LangGraph + Gemini"
    // Fade in frames 90-120
    const subtitleOpacity = interpolate(frame, [90, 120], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
    });

    // 4. GCP Logo Pulse
    // Center-right, subtle pulse
    const pulse = Math.sin(frame / 12) * 0.05 + 1;
    const gcpLogoPath = staticFile('icons/gcp/cloud_generic.svg');

    // 5. Lofi Particles (Starfield vibe)
    const particles = Array.from({ length: 40 }).map((_, i) => {
        const seed = i * 456.78;
        const x = ((seed * 1.5) % 1) * width;
        const y = ((seed * 2.5) % 1) * height;
        const size = (seed % 1) * 3 + 1;
        const opacity = (Math.sin(frame / (20 + (i % 10)) + seed) + 1) / 2 * 0.4;
        const drift = interpolate(frame, [0, 300], [0, (seed % 1) * 50 - 25]);
        
        return (
            <div
                key={i}
                style={{
                    position: 'absolute',
                    left: x + drift,
                    top: y,
                    width: size,
                    height: size,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    opacity,
                    boxShadow: '0 0 10px white',
                }}
            />
        );
    });

    return (
        <AbsoluteFill style={bgStyle}>
            {/* Particles */}
            {particles}

            {/* Ambient Glow */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '1200px',
                height: '1200px',
                background: 'radial-gradient(circle, rgba(41, 151, 255, 0.05) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Main Content Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                padding: '0 80px',
                textAlign: 'center',
                zIndex: 1,
            }}>
                {/* Title */}
                <h1 style={{
                    color: 'white',
                    fontSize: '110px',
                    fontWeight: 800,
                    fontFamily: 'Inter, sans-serif',
                    margin: 0,
                    transform: `scale(${titleSpring})`,
                    opacity: titleOpacity,
                    textShadow: '0 0 40px rgba(255, 255, 255, 0.3), 0 10px 30px rgba(0,0,0,0.5)',
                    letterSpacing: '-2px',
                }}>
                    Agentic AI Workflows
                </h1>

                {/* Subtitle */}
                <h2 style={{
                    color: '#86868B',
                    fontSize: '48px',
                    fontWeight: 500,
                    fontFamily: 'Inter, sans-serif',
                    marginTop: '40px',
                    opacity: subtitleOpacity,
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                }}>
                    GCP + LangGraph + Gemini
                </h2>
            </div>

            {/* GCP Logo Pulse (Center-Right-ish) */}
            <div style={{
                position: 'absolute',
                right: '12%',
                top: '38%',
                transform: `scale(${pulse})`,
                opacity: 0.8,
                filter: 'drop-shadow(0 0 20px rgba(41, 151, 255, 0.4))',
            }}>
                <Img
                    src={gcpLogoPath}
                    style={{
                        width: '240px',
                        height: '240px',
                    }}
                />
            </div>

            {/* Watermark (following GEMINI.md) */}
            <div style={{
                position: 'absolute',
                bottom: '80px',
                left: '80px',
                color: 'white',
                opacity: 0.4,
                fontSize: '24px',
                fontWeight: 600,
                letterSpacing: '4px',
                textTransform: 'uppercase',
            }}>
                @ai_cloud_architect
            </div>
        </AbsoluteFill>
    );
};

