import { Series, Sequence, Audio, AbsoluteFill } from 'remotion';
import { Intro } from './components/Intro';
import { ContentSection } from './components/ContentSection';
import { Outro } from './components/Outro';
import { VideoProps } from './types';
import { mergeDesign } from './designDefaults';
import React from 'react';

export const MainVideo: React.FC<VideoProps> = ({ content, diagrams, design: rawDesign, config }) => {
    if (!content || !content.answer_sections) return null;

    const d = mergeDesign(rawDesign);
    const INTRO_DURATION = config?.introFrames ?? 180;
    const OUTRO_DURATION = config?.outroFrames ?? 180;

    const BG_MUSIC_VOLUME = 0.07;
    const VOICE_VOLUME = 1.0;

    return (
        <React.Fragment>
            <AbsoluteFill style={{ backgroundColor: d.palette.background }} />

            {config?.bgMusicPath && (
                <Audio src={config.bgMusicPath} volume={BG_MUSIC_VOLUME} loop />
            )}

            <Series>
                {/* INTRO */}
                <Series.Sequence durationInFrames={INTRO_DURATION}>
                    <Intro content={content} config={config} design={d} />
                    {config?.introVoicePath && (
                        <Audio src={config.introVoicePath} volume={VOICE_VOLUME} />
                    )}
                </Series.Sequence>

                {/* CONTENT SECTIONS */}
                {content.answer_sections.map((section, idx) => {
                    const diagram = (diagrams || []).find(d => d.section_id === section.id);
                    const secTiming = config?.sectionTimings?.find(s => s.id === section.id);
                    const sectionFrames = secTiming ? secTiming.durationFrames : 300;

                    return (
                        <Series.Sequence key={section.id ?? idx} durationInFrames={sectionFrames}>
                            <ContentSection
                                section={section}
                                diagram={diagram}
                                sectionIndex={idx}
                                config={config}
                                design={d}
                            />
                            {secTiming?.voicePath && (
                                <Audio src={secTiming.voicePath} volume={VOICE_VOLUME} />
                            )}
                            {config?.sfx?.whoosh && (
                                <Audio src={config.sfx.whoosh} volume={0.35} />
                            )}
                            {diagram && config?.sfx?.pop && secTiming && (
                                <Sequence from={secTiming.phaseAFrames + secTiming.phaseBFrames}>
                                    <Audio src={config.sfx.pop} volume={0.45} />
                                </Sequence>
                            )}
                        </Series.Sequence>
                    );
                })}

                {/* OUTRO */}
                <Series.Sequence durationInFrames={OUTRO_DURATION}>
                    <Outro content={{ ...content, config }} design={d} />
                    {config?.outroVoicePath && (
                        <Audio src={config.outroVoicePath} volume={VOICE_VOLUME} />
                    )}
                </Series.Sequence>
            </Series>
        </React.Fragment>
    );
};

export default MainVideo;
