import { Series, Sequence, Audio, AbsoluteFill } from 'remotion';
import { Intro } from './components/Intro';
import { ContentSection } from './components/ContentSection';
import { Outro } from './components/Outro';
import { VideoProps } from './types';
import React from 'react';

export const MainVideo: React.FC<VideoProps> = ({ content, diagrams, config }) => {
    if (!content || !content.answer_sections) return null;

    const INTRO_DURATION = config?.introFrames ?? 180;
    const OUTRO_DURATION = config?.outroFrames ?? 180;

    // Audio volume levels
    const BG_MUSIC_VOLUME = 0.07;   // Low — texture only, doesn't compete with voice
    const VOICE_VOLUME = 1.0;

    return (
        <React.Fragment>
            <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />

            {/* Background music — looping, very low volume */}
            {config?.bgMusicPath && (
                <Audio src={config.bgMusicPath} volume={BG_MUSIC_VOLUME} loop />
            )}

            <Series>
                {/* ── INTRO ── */}
                <Series.Sequence durationInFrames={INTRO_DURATION}>
                    <Intro content={content} config={config} />
                    {config?.introVoicePath && (
                        <Audio src={config.introVoicePath} volume={VOICE_VOLUME} />
                    )}
                </Series.Sequence>

                {/* ── CONTENT SECTIONS ── */}
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
                            {/* Per-section voiceover */}
                            {secTiming?.voicePath && (
                                <Audio src={secTiming.voicePath} volume={VOICE_VOLUME} />
                            )}
                            {/* Whoosh SFX at section start */}
                            {config?.sfx?.whoosh && (
                                <Audio src={config.sfx.whoosh} volume={0.35} />
                            )}
                            {/* Pop SFX when diagram card appears */}
                            {diagram && config?.sfx?.pop && secTiming && (
                                <Sequence from={secTiming.phaseAFrames + secTiming.phaseBFrames}>
                                    <Audio src={config.sfx.pop} volume={0.45} />
                                </Sequence>
                            )}
                        </Series.Sequence>
                    );
                })}

                {/* ── OUTRO ── */}
                <Series.Sequence durationInFrames={OUTRO_DURATION}>
                    <Outro content={{ ...content, config }} />
                    {config?.outroVoicePath && (
                        <Audio src={config.outroVoicePath} volume={VOICE_VOLUME} />
                    )}
                </Series.Sequence>
            </Series>
        </React.Fragment>
    );
};

export default MainVideo;
