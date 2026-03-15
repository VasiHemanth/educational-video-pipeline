import { Composition, getInputProps } from 'remotion';
import { MainVideo } from './MainVideo';
import { Thumbnail } from './components/Thumbnail';
import { AgenticReel } from './AgenticReel';
import { MotivationReel } from './MotivationReel';
import { EducationalReel } from './scenes/EducationalReel';
import { EducationalThumbnail } from './EducationalThumbnail';
import { AnswerSection, DiagramInfo, VideoProps } from './types';
import { MotivationReelProps } from './MotivationTypes';
import { EducationalReelProps } from './EducationalTypes';
import React from 'react';

// Default mock props for local preview
const defaultProps: VideoProps = {
  content: {
    topic: "Preview",
    question_number: "Q1",
    question_text: "How would you design a scalable ETL pipeline on GCP using Dataflow and BigQuery?",
    answer_sections: [
      {
        id: "1",
        title: "ARCHITECTURE",
        text: "Cloud Dataflow is a fully managed streaming and batch data processing service. It integrates natively with BigQuery to ingest, transform and analyze large datasets efficiently.",
        duration_seconds: 12,
        keywords: { tech_terms: ["Dataflow", "BigQuery"], action_verbs: ["transform", "analyze"], concepts: ["ETL", "streaming", "batch"] },
      },
      {
        id: "2",
        title: "SCALABILITY",
        text: "Dataflow automatically scales horizontally using Apache Beam runners. Workers are provisioned on demand and de-provisioned when the job completes, minimizing cost.",
        duration_seconds: 12,
        keywords: { tech_terms: ["Dataflow", "Apache Beam"], action_verbs: ["scales", "provisioned"], concepts: ["horizontal", "auto-scaling"] },
      },
    ],
  },
  diagrams: [],
  config: { animStyle: 'highlight', pauseFrames: 30 }
};

const defaultEducationalProps: EducationalReelProps = {
  content: {
    topic: 'Skeleton Screens',
    domain: 'UX Design',
    title: 'Loading States That Feel Instant',
    hookText: 'Same loading time. Different feeling.',
    ctaText: 'Save this for your next build 🔖',
    scenes: [
      {
        id: 'hook',
        sceneType: 'hook',
        title: '',
        text: 'Same loading time.\nDifferent feeling.\nHere\'s how.',
        spokenAudio: 'Same loading time, but completely different feeling. Here is how.',
        visualFormat: 'text_only',
        visualData: null,
        keywords: { tech_terms: ['Cloud Run', 'GKE'], concepts: ['Serverless', 'Containers'] },
        durationSeconds: 4,
      },
      {
        id: 'concept_1',
        sceneType: 'concept',
        title: 'Skeleton Screens',
        text: 'Load the shape first.\nThen the data.\nUsers stay engaged.',
        spokenAudio: 'Load the shape first, then the data, and users will stay engaged.',
        visualFormat: 'diagram',
        visualData: {
          direction: 'LR',
          nodes: [
            { id: 'n1', label: 'Empty State', type: 'user', iconName: '👤' },
            { id: 'n2', label: 'Skeleton', type: 'process', iconName: '⏳' },
            { id: 'n3', label: 'Content', type: 'database', iconName: '✨' }
          ],
          edges: [
            { from: 'n1', to: 'n2', label: 'Click' },
            { from: 'n2', to: 'n3', label: 'Loaded' }
          ]
        },
        keywords: { tech_terms: ['shape'], concepts: ['engaged'] },
        durationSeconds: 10,
      },
      {
        id: 'synthesis',
        sceneType: 'synthesis',
        title: 'The Complete Pattern',
        text: 'Skeleton -> Optimistic UI -> Progress Illusion.\nAll three together make loading invisible.',
        spokenAudio: 'Combine skeleton screens, optimistic UI, and progress illusions to eliminate perceived loading entirely.',
        visualFormat: 'text_only',
        visualData: null,
        keywords: { tech_terms: ['Compute Engine', 'Cloud Storage'], concepts: ['IaaS', 'Object Storage'] },
        durationSeconds: 8,
      },
      {
        id: 'cta',
        sceneType: 'cta',
        title: '',
        text: 'Save this for your next build.',
        spokenAudio: 'Save this for your next build.',
        visualFormat: 'text_only',
        visualData: null,
        keywords: {},
        durationSeconds: 4,
      },
    ],
  },
  config: {
    totalFrames: 900,
    sceneTimings: [
      { id: 'hook', startFrame: 0, durationFrames: 120, phaseText: 60, phaseVisual: 0, phaseDwell: 60, phaseTransition: 0 },
      { id: 'concept_1', startFrame: 120, durationFrames: 300, phaseText: 60, phaseVisual: 15, phaseDwell: 225, phaseTransition: 0 },
      { id: 'synthesis', startFrame: 420, durationFrames: 300, phaseText: 50, phaseVisual: 10, phaseDwell: 240, phaseTransition: 0 },
      { id: 'cta', startFrame: 720, durationFrames: 180, phaseText: 30, phaseVisual: 0, phaseDwell: 150, phaseTransition: 0 },
    ],
    sfxEvents: [],
    watermark: 'LEARN',
    watermarkSub: 'by Hemanth Vasi',
    thumbnail_headline: 'LOADING FASTER',
    thumbnail_subheadline: 'UX DESIGN SECRETS',
  },
};

const isLegacyVideoProps = (props: unknown): props is VideoProps => {
  if (!props || typeof props !== 'object') return false;
  const candidate = props as VideoProps;
  return Boolean(candidate.content && Array.isArray(candidate.content.answer_sections));
};

const isEducationalVideoProps = (props: unknown): props is EducationalReelProps => {
  if (!props || typeof props !== 'object') return false;
  const candidate = props as EducationalReelProps;
  return Boolean(candidate.content && Array.isArray(candidate.content.scenes));
};

// Pure function to calculate base section frames (without scaling)
export const calculateBaseSectionFrames = (
  section: Pick<AnswerSection, 'text'>,
  diagram: DiagramInfo | undefined,
  pauseFrames: number
) => {
  const words = section.text?.split(' ') || [];
  const hasDiagram = !!(diagram && (diagram.pngPath || diagram.isNative));

  // Scientific duration:
  // 4f per word (~300 WPM text streaming) + 60f diagram viewing penalty + 45f animation buffer + user pause
  return (words.length * 4) + (hasDiagram ? 60 : 0) + 45 + pauseFrames;
};

export const RemotionRoot: React.FC = () => {
  const dynamicProps = getInputProps();
  const legacyProps = isLegacyVideoProps(dynamicProps) ? dynamicProps : defaultProps;
  const educationalProps = isEducationalVideoProps(dynamicProps) ? dynamicProps : defaultEducationalProps;

  const INTRO = legacyProps.config?.introFrames ?? 180;
  const OUTRO = legacyProps.config?.outroFrames ?? 180;

  // If sectionTimings are pre-calculated by the Pipeline (auto mode), use those exactly:
  let legacyTotal = legacyProps.config?.totalFrames;

  if (!legacyTotal) {
    // Fallback for local development Preview:
    const pauseFrames = legacyProps.config?.pauseFrames ?? 30;
    const baseFrames = legacyProps.content.answer_sections.reduce((acc, section) => {
      const diagram = (legacyProps.diagrams || []).find(d => d.section_id === section.id);
      return acc + calculateBaseSectionFrames(section, diagram, pauseFrames);
    }, 0);
    const MAX_CONTENT_FRAMES = 2250 - INTRO - OUTRO;
    const scaledContentFrames = Math.min(baseFrames, MAX_CONTENT_FRAMES);
    legacyTotal = INTRO + scaledContentFrames + OUTRO;
  }

  return (
    <>
      <Composition
        id="MainVideo"
        component={MainVideo}
        durationInFrames={legacyTotal}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={legacyProps}
      />
      <Composition
        id="Thumbnail"
        component={Thumbnail}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={legacyProps}
      />
      <Composition
        id="AgenticReel"
        component={AgenticReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ─── Motivation Reels ─── */}
      <Composition
        id="MotivationReel"
        component={MotivationReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          quote: "Behind my obsession\nto be better everyday,\nis a kid who realized\nno one was coming\nto save him.",
          watermark: "LEVEL UP",
          fontStyle: "playfair" as const,
          bgStyle: "grain" as const,
        } satisfies MotivationReelProps}
      />
      <Composition
        id="MotivationReel-Cormorant"
        component={MotivationReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          quote: "Behind my obsession\nto be better everyday,\nis a kid who realized\nno one was coming\nto save him.",
          watermark: "LEVEL UP",
          fontStyle: "cormorant" as const,
          bgStyle: "grain" as const,
        } satisfies MotivationReelProps}
      />
      <Composition
        id="MotivationReel-DMSerif"
        component={MotivationReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          quote: "Behind my obsession\nto be better everyday,\nis a kid who realized\nno one was coming\nto save him.",
          watermark: "LEVEL UP",
          fontStyle: "dm-serif" as const,
          bgStyle: "grain" as const,
        } satisfies MotivationReelProps}
      />

      {/* ─── Educational Reel (New Pipeline) ─── */}
      <Composition
        id="EducationalReel"
        component={EducationalReel}
        durationInFrames={educationalProps.config.totalFrames || 900}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={async ({ props }) => {
          // Use totalFrames from pipeline assembler, fallback to 900 (30s) for preview
          const p = props as EducationalReelProps;
          const frames = p?.config?.totalFrames || 900;
          return { durationInFrames: frames };
        }}
        defaultProps={educationalProps}
      />
      <Composition
        id="EducationalThumbnail"
        component={EducationalThumbnail}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={educationalProps}
      />
    </>
  );
};
