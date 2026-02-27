import { Series, Audio } from 'remotion';
import { Intro } from './components/Intro';
import { ContentSection } from './components/ContentSection';
import { Outro } from './components/Outro';
import { VideoProps } from './types';
import React from 'react';
import { calculateBaseSectionFrames } from './Root';
import { AbsoluteFill } from 'remotion';

export const MainVideo: React.FC<VideoProps> = ({ content, diagrams, config }) => {
    if (!content || !content.answer_sections) return null;

    const INTRO_DURATION = config?.introFrames ?? 180;
    const OUTRO_DURATION = config?.outroFrames ?? 180;

    return (
        <React.Fragment>
            <style>
                {`
                @keyframes pan {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                `}
            </style>

            <AbsoluteFill style={{
                background: 'linear-gradient(225deg, #0D1117 0%, #161B22 50%, #0D1117 100%)',
                backgroundSize: '200% 200%',
                animation: 'pan 30s ease infinite',
            }} />

            {config?.bgMusicPath && (
                <Audio src={config.bgMusicPath} volume={0.15} loop />
            )}
            <Series>
                <Series.Sequence durationInFrames={INTRO_DURATION}>
                    <Intro content={content} config={config} />
                </Series.Sequence>

                {content.answer_sections.map((section, idx) => {
                    const diagram = (diagrams || []).find(d => d.section_id === section.id);

                    // Priority to Pipeline JSON pre-calculated frames, fallback to default 300
                    const secTiming = config?.sectionTimings?.find(s => s.id === section.id);
                    const sectionFrames = secTiming ? secTiming.durationFrames : 300;

                    return (
                        <Series.Sequence key={section.id ?? idx} durationInFrames={sectionFrames}>
                            <ContentSection
                                section={section}
                                diagram={diagram}
                                sectionIndex={idx}
                                config={config}
                            />
                        </Series.Sequence>
                    );
                })}

                <Series.Sequence durationInFrames={OUTRO_DURATION}>
                    <Outro content={{ ...content, config }} />
                </Series.Sequence>
            </Series>
        </React.Fragment>
    );
};

export default MainVideo;
