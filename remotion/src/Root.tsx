import { Composition, getInputProps, Series } from 'remotion';
import { MainVideo } from './MainVideo';
import { VideoProps } from './types';
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
        keywords: { gcp_services: ["Dataflow", "BigQuery"], action_verbs: ["transform", "analyze"], concepts: ["ETL", "streaming", "batch"] },
      },
      {
        id: "2",
        title: "SCALABILITY",
        text: "Dataflow automatically scales horizontally using Apache Beam runners. Workers are provisioned on demand and de-provisioned when the job completes, minimizing cost.",
        duration_seconds: 12,
        keywords: { gcp_services: ["Dataflow"], action_verbs: ["scales", "provisioned"], concepts: ["horizontal", "Apache Beam"] },
      },
    ],
  },
  diagrams: [],
  config: { animStyle: 'highlight', pauseFrames: 30 }
};

// Pure function to calculate base section frames (without scaling)
export const calculateBaseSectionFrames = (section: any, diagram: any, pauseFrames: number) => {
  const words = section.text?.split(' ') || [];
  const hasDiagram = !!(diagram && diagram.pngPath);

  // Scientific duration:
  // 9f per word (~200 WPM reading speed) + 60f diagram viewing penalty + 45f animation buffer + user pause
  return (words.length * 9) + (hasDiagram ? 60 : 0) + 45 + pauseFrames;
};

export const RemotionRoot: React.FC = () => {
  const dynamicProps = getInputProps() as VideoProps;

  const activeProps = (dynamicProps && dynamicProps.content && dynamicProps.content.answer_sections)
    ? dynamicProps
    : defaultProps;

  const INTRO = 180;
  const OUTRO = 180;
  const pauseFrames = activeProps.config?.pauseFrames ?? 30;

  const baseFrames = activeProps.content.answer_sections.reduce((acc, section) => {
    const diagram = (activeProps.diagrams || []).find(d => d.section_id === section.id);
    return acc + calculateBaseSectionFrames(section, diagram, pauseFrames);
  }, 0);

  const MAX_CONTENT_FRAMES = 2250 - INTRO - OUTRO;
  const scaledContentFrames = Math.min(baseFrames, MAX_CONTENT_FRAMES);

  const total = INTRO + scaledContentFrames + OUTRO;

  return (
    <Composition
      id="MainVideo"
      component={MainVideo as React.FC<any>}
      durationInFrames={total}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={activeProps}
    />
  );
};
