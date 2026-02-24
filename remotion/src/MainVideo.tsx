import { Series } from 'remotion';
import { Intro } from './components/Intro';
import { ContentSection } from './components/ContentSection';
import { Outro } from './components/Outro';
import { VideoProps } from './types';
import React from 'react';
import { calculateBaseSectionFrames } from './Root';

export const MainVideo: React.FC<VideoProps> = ({ content, diagrams, config }) => {
    if (!content || !content.answer_sections) return null;

    const INTRO_DURATION = 180;
    const OUTRO_DURATION = 180;
    const pauseFrames = config?.pauseFrames ?? 30;

    // Calculate base frames for all sections
    const baseFrames = content.answer_sections.map(section => {
        const diagram = (diagrams || []).find(d => d.section_id === section.id);
        return calculateBaseSectionFrames(section, diagram, pauseFrames);
    });

    const totalBaseContentFrames = baseFrames.reduce((a, b) => a + b, 0);
    const MAX_CONTENT_FRAMES = 2250 - INTRO_DURATION - OUTRO_DURATION; // 75 seconds limit

    // Scale down sections if they exceed the Shorts duration limit
    const scaleFactor = totalBaseContentFrames > MAX_CONTENT_FRAMES
        ? MAX_CONTENT_FRAMES / totalBaseContentFrames
        : 1;

    return (
        <Series>
            <Series.Sequence durationInFrames={INTRO_DURATION}>
                <Intro content={content} />
            </Series.Sequence>

            {content.answer_sections.map((section, idx) => {
                const diagram = (diagrams || []).find(d => d.section_id === section.id);
                const sectionFrames = Math.floor(baseFrames[idx] * scaleFactor);

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
                <Outro />
            </Series.Sequence>
        </Series>
    );
};

export default MainVideo;
