#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { assembleVideo } = require('./assembler');

const QUESTION = 9903;
const OUT_DIR = path.join(__dirname, '..', 'output_prod');

const content = {
  topic: 'Multi-Agent Realtime Insight System',
  domain: 'AI Systems',
  title: 'Build a Realtime Multi-Agent Decision Loop',
  hookText: 'A system that knows when to act and when to ask for help.',
  ctaText: 'Save this for your next build.',
  scenes: [
    {
      id: 'hook',
      sceneType: 'ticker_hook',
      title: 'Confidence Gate',
      text: 'Real-time agents must decide fast without guessing.',
      spokenAudio:
        'Real time agents are only useful when they can decide fast without guessing.',
      visualFormat: 'ticker_hook',
      visualData: {
        hookStyle: 'question',
        question: 'Act or Escalate?',
        reveal: 'Confidence Gate',
      },
      keywords: { concepts: ['confidence gate', 'real time'] },
      durationSeconds: 4,
    },
    {
      id: 'decision_loop',
      sceneType: 'decision_loop',
      title: 'Route, Evaluate, Decide',
      text:
        'Every signal goes through specialists, a consensus gate, and a clear action.',
      spokenAudio:
        'Every signal goes through specialists, a consensus gate, and a clear action.',
      visualFormat: 'diagram',
      visualData: {
        direction: 'LR',
        nodes: [
          { id: 'event', label: 'Event', type: 'messaging', position: { x: 12, y: 50 } },
          { id: 'orchestrator', label: 'Orchestrator', type: 'process', position: { x: 28, y: 50 } },
          { id: 'agent_a', label: 'Agent A', type: 'compute', position: { x: 46, y: 28 } },
          { id: 'agent_b', label: 'Agent B', type: 'compute', position: { x: 46, y: 50 } },
          { id: 'agent_c', label: 'Agent C', type: 'compute', position: { x: 46, y: 72 } },
          { id: 'aggregator', label: 'Consensus', type: 'process', position: { x: 66, y: 50 } },
          { id: 'gate', label: 'Confidence Gate', type: 'decision', position: { x: 80, y: 50 } },
          { id: 'execute', label: 'Execute', type: 'process', position: { x: 92, y: 34 } },
          { id: 'escalate', label: 'Escalate', type: 'user', position: { x: 92, y: 66 } },
          { id: 'audit', label: 'Audit Log', type: 'storage', position: { x: 80, y: 84 } },
        ],
        edges: [
          { id: 'event-orch', from: 'event', to: 'orchestrator' },
          { id: 'orch-a', from: 'orchestrator', to: 'agent_a' },
          { id: 'orch-b', from: 'orchestrator', to: 'agent_b' },
          { id: 'orch-c', from: 'orchestrator', to: 'agent_c' },
          { id: 'a-agg', from: 'agent_a', to: 'aggregator' },
          { id: 'b-agg', from: 'agent_b', to: 'aggregator' },
          { id: 'c-agg', from: 'agent_c', to: 'aggregator' },
          { id: 'agg-gate', from: 'aggregator', to: 'gate' },
          { id: 'gate-exec', from: 'gate', to: 'execute', label: 'auto' },
          { id: 'gate-esc', from: 'gate', to: 'escalate', label: 'human' },
          { id: 'exec-audit', from: 'execute', to: 'audit' },
          { id: 'esc-audit', from: 'escalate', to: 'audit' },
        ],
        beats: [
          {
            id: 'beat-1',
            label: 'Signal In',
            title: 'Route the event',
            detail: 'Capture the event and pass it to the orchestrator.',
            chip: 'Event',
            activeNodeIds: ['event', 'orchestrator'],
            activeEdgeIds: ['event-orch'],
          },
          {
            id: 'beat-2',
            label: 'Specialists',
            title: 'Parallel analysis',
            detail: 'Specialist agents evaluate the signal in parallel.',
            chip: 'Agents',
            activeNodeIds: ['agent_a', 'agent_b', 'agent_c'],
            activeEdgeIds: ['orch-a', 'orch-b', 'orch-c'],
          },
          {
            id: 'beat-3',
            label: 'Consensus',
            title: 'Merge evidence',
            detail: 'Aggregate outputs into a shared confidence score.',
            chip: 'Consensus',
            activeNodeIds: ['aggregator'],
            activeEdgeIds: ['a-agg', 'b-agg', 'c-agg'],
          },
          {
            id: 'beat-4',
            label: 'Confidence Gate',
            title: 'Decide the path',
            detail: 'If confidence is high, execute. If not, escalate.',
            chip: 'Gate',
            activeNodeIds: ['gate'],
            activeEdgeIds: ['agg-gate'],
          },
          {
            id: 'beat-5',
            label: 'Execution',
            title: 'Act fast',
            detail: 'High confidence triggers automated action.',
            chip: 'Execute',
            activeNodeIds: ['execute'],
            activeEdgeIds: ['gate-exec'],
            emphasis: 'execute',
          },
          {
            id: 'beat-6',
            label: 'Escalation',
            title: 'Ask for help',
            detail: 'Low confidence routes to a human decision.',
            chip: 'Escalate',
            activeNodeIds: ['escalate'],
            activeEdgeIds: ['gate-esc'],
            emphasis: 'escalate',
          },
          {
            id: 'beat-7',
            label: 'Audit',
            title: 'Write the trail',
            detail: 'Every decision lands in the audit log.',
            chip: 'Audit',
            activeNodeIds: ['audit'],
            activeEdgeIds: ['exec-audit', 'esc-audit'],
          },
        ],
      },
      keywords: { concepts: ['decision loop', 'confidence', 'escalation'] },
      durationSeconds: 14,
    },
    {
      id: 'specialists',
      sceneType: 'concept',
      title: 'Specialist Swarm',
      text: 'Each agent handles a single lens: risk, context, and action.',
      spokenAudio:
        'Each agent handles a single lens: risk, context, and action.',
      visualFormat: 'diagram',
      visualData: {
        direction: 'TB',
        nodes: [
          { id: 'risk', label: 'Risk Agent', type: 'compute' },
          { id: 'context', label: 'Context Agent', type: 'compute' },
          { id: 'action', label: 'Action Agent', type: 'compute' },
          { id: 'score', label: 'Confidence Score', type: 'process' },
        ],
        edges: [
          { from: 'risk', to: 'score' },
          { from: 'context', to: 'score' },
          { from: 'action', to: 'score' },
        ],
      },
      keywords: { concepts: ['specialists', 'confidence'] },
      durationSeconds: 8,
    },
    {
      id: 'pullback',
      sceneType: 'concept',
      title: 'System Pullback',
      text: 'Ingest, orchestrate, decide, and notify in a single realtime flow.',
      spokenAudio:
        'Ingest, orchestrate, decide, and notify in a single realtime flow.',
      visualFormat: 'diagram',
      visualData: {
        direction: 'LR',
        nodes: [
          { id: 'ingest', label: 'Ingest', type: 'messaging' },
          { id: 'stream', label: 'Stream', type: 'process' },
          { id: 'memory', label: 'Memory', type: 'database' },
          { id: 'agents', label: 'Agent Mesh', type: 'compute' },
          { id: 'gate', label: 'Gate', type: 'decision' },
          { id: 'actions', label: 'Actions', type: 'process' },
          { id: 'alerts', label: 'Alerts', type: 'user' },
        ],
        edges: [
          { from: 'ingest', to: 'stream' },
          { from: 'stream', to: 'memory' },
          { from: 'memory', to: 'agents' },
          { from: 'agents', to: 'gate' },
          { from: 'gate', to: 'actions' },
          { from: 'gate', to: 'alerts' },
        ],
      },
      keywords: { concepts: ['architecture', 'real time'] },
      durationSeconds: 8,
    },
    {
      id: 'synthesis',
      sceneType: 'synthesis',
      title: 'Loop Summary',
      text:
        'Route the signal. Compare specialist output. Decide. Log. Repeat.',
      spokenAudio:
        'Route the signal, compare specialist output, decide, log, and repeat.',
      visualFormat: 'text_only',
      visualData: null,
      keywords: { concepts: ['loop', 'decision'] },
      durationSeconds: 6,
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
  hashtags: ['#ai', '#agents', '#realtime', '#systems'],
  techTerms: ['multi-agent', 'real time'],
};

const metadata = {
  thumbnail: {
    headline: 'DECISION LOOP',
    subheadline: 'REALTIME AGENTS',
  },
};

const main = async () => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const contentPath = path.join(OUT_DIR, `q${QUESTION}_content.json`);
  const metadataPath = path.join(OUT_DIR, `q${QUESTION}_metadata.json`);
  fs.writeFileSync(contentPath, JSON.stringify(content, null, 2));
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  const voiceManifestPath = path.join(
    __dirname,
    '..',
    'voice_output',
    `q${QUESTION}_manifest.json`,
  );
  const voiceManifest = fs.existsSync(voiceManifestPath)
    ? JSON.parse(fs.readFileSync(voiceManifestPath, 'utf8'))
    : null;

  await assembleVideo(content, [], metadata, QUESTION, true, {
    platform: 'youtube',
    watermark: 'SIGNAL',
    watermarkSub: 'decision loop',
    voiceManifest,
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
