import React from 'react';
import { Series, Audio, AbsoluteFill, useCurrentFrame } from 'remotion';
import { ScenesVideo } from './types';
import { SceneRenderer } from './SceneRenderer';

export interface DynamicVideoProps {
    scenes: ScenesVideo;
    audio?: {
        bgMusicPath?: string;
        voiceSegments?: Record<string, string>;  // key -> data URI
        introVoicePath?: string;
        outroVoicePath?: string;
    };
}

export const DynamicVideo: React.FC<DynamicVideoProps> = ({ scenes, audio }) => {
    const frame = useCurrentFrame();
    const totalFrames = scenes.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
    const globalProgress = (frame / totalFrames) * 100;

    return (
        <React.Fragment>
            <AbsoluteFill style={{ backgroundColor: scenes.scenes[0]?.background.color ?? '#0A0A0A' }} />

            {/* Background music */}
            {audio?.bgMusicPath && (
                <Audio src={audio.bgMusicPath} volume={0.07} loop />
            )}

            <Series>
                {scenes.scenes.map((scene, idx) => (
                    <Series.Sequence key={scene.id} durationInFrames={scene.durationFrames}>
                        <SceneRenderer
                            scene={scene}
                            globalProgress={globalProgress}
                            fontFamily={scenes.meta.fontFamily}
                        />

                        {/* Voice audio for this scene */}
                        {scene.audio?.voiceKey && audio?.voiceSegments?.[scene.audio.voiceKey] && (
                            <Audio src={audio.voiceSegments[scene.audio.voiceKey]} volume={1.0} />
                        )}
                    </Series.Sequence>
                ))}
            </Series>
        </React.Fragment>
    );
};

export default DynamicVideo;
