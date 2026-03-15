/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   EducationalReel — The Cinematic Video Composition          ║
 * ║                                                              ║
 * ║   5-Act Structure: Hook → Tension → Reveal → Proof → Win    ║
 * ║                                                              ║
 * ║   Scene types: ticker_hook, pain_chaos, reveal_diagram,      ║
 * ║   timeline_steps, identity_cta — each with distinct visual   ║
 * ║   style, mood background, and SFX signature.                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import React from 'react';
import { AbsoluteFill, Audio, Series } from 'remotion';
import { HookScene } from './HookScene';
import { TickerHookScene } from './TickerHookScene';
import { PainChaosScene } from './PainChaosScene';
import { TimelineStepsScene } from './TimelineStepsScene';
import { DecisionLoopScene } from './DecisionLoopScene';
import { ConceptScene } from './ConceptScene';
import { SynthesisScene } from './SynthesisScene';
import { CTAScene } from './CTAScene';
import { SFXProvider } from '../audio/SFXProvider';
import { EducationalReelProps, VideoScene } from '../EducationalTypes';


// Route a scene to its component
const SceneRenderer: React.FC<{
  scene: VideoScene;
  sceneIndex: number;
  timing?: EducationalReelProps['config']['sceneTimings'][number];
  watermark?: string;
  watermarkSub?: string;
}> = ({ scene, sceneIndex, timing, watermark, watermarkSub }) => {
  switch (scene.sceneType) {
    // ── New cinematic scene types ──────────────────────────────────────────
    case 'ticker_hook':
      return <TickerHookScene scene={scene} />;

    case 'decision_loop':
      return <DecisionLoopScene scene={scene} timing={timing} />;

    case 'pain_chaos':
    case 'problem':
      return <PainChaosScene scene={scene} />;

    case 'timeline_steps':
      return <TimelineStepsScene scene={scene} sceneIndex={sceneIndex} />;

    // ── Legacy / existing scene types ──────────────────────────────────────
    case 'hook':
      return <HookScene scene={scene} />;

    case 'reveal_diagram':
    case 'concept':
    case 'comparison':
    case 'demo':
    case 'roadmap':
    case 'solution':
      return (
        <ConceptScene
          scene={scene}
          sceneIndex={sceneIndex}
          timing={timing}
          watermark={watermark}
          watermarkSub={watermarkSub}
        />
      );

    case 'synthesis':
      return <SynthesisScene scene={scene} />;

    case 'identity_cta':
    case 'cta':
      return <CTAScene scene={scene} watermark={watermark} watermarkSub={watermarkSub} />;

    default:
      return (
        <ConceptScene
          scene={scene}
          sceneIndex={sceneIndex}
          timing={timing}
          watermark={watermark}
          watermarkSub={watermarkSub}
        />
      );
  }
};

export const EducationalReel: React.FC<EducationalReelProps> = ({ content, config }) => {
  if (!content || !content.scenes || content.scenes.length === 0) return null;

  // Background music volume
  const BG_MUSIC_VOLUME = 0.07;
  const VOICE_VOLUME = 1.0;

  return (
    <React.Fragment>
      <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }} />

      {/* Background music */}
      {config.bgMusicPath && (
        <Audio src={config.bgMusicPath} volume={BG_MUSIC_VOLUME} loop />
      )}

      {/* Scene series */}
      <Series>
        {content.scenes.map((scene, idx) => {
          const timing = config.sceneTimings?.find(t => t.id === scene.id);
          const durationFrames = timing?.durationFrames || 150;

          return (
            <Series.Sequence key={scene.id} durationInFrames={durationFrames}>
              <SceneRenderer
                scene={scene}
                sceneIndex={idx}
                timing={timing}
                watermark={config.watermark}
                watermarkSub={config.watermarkSub}
              />

              {/* Per-scene voiceover */}
              {timing?.voicePath && (
                <Audio src={timing.voicePath} volume={VOICE_VOLUME} />
              )}
            </Series.Sequence>
          );
        })}
      </Series>

      {/* SFX events handled centrally */}
      <SFXProvider events={config.sfxEvents || []} />
    </React.Fragment>
  );
};

export default EducationalReel;
