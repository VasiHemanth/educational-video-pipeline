import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {
  DiagramBeat,
  DiagramData,
  DiagramEdge,
  DiagramNode,
  SceneTiming,
  VideoScene,
} from '../EducationalTypes';
import { MoodBackground } from '../design/MoodBackground';
import { COLORS, EFFECTS, FONTS, FONT_SIZES, getMoodColor, LAYOUT } from '../design/theme';

interface DecisionLoopSceneProps {
  scene: VideoScene;
  timing?: SceneTiming;
}

const FALLBACK_BEAT: DiagramBeat = {
  id: 'beat-1',
  label: 'Decision Loop',
  detail: 'Route, evaluate, and act on real-time signals.',
  activeNodeIds: [],
};

const resolveEdgeId = (edge: DiagramEdge) => edge.id || `${edge.from}-${edge.to}`;

const buildFallbackBeats = (data: DiagramData | null | undefined): DiagramBeat[] => {
  if (!data?.nodes?.length) return [FALLBACK_BEAT];
  const ids = data.nodes.map((node) => node.id);
  return [
    {
      id: 'beat-1',
      label: 'Signal In',
      detail: 'Capture the event and hand it to the orchestrator.',
      activeNodeIds: ids.slice(0, 2),
    },
    {
      id: 'beat-2',
      label: 'Decision',
      detail: 'Route the request to the right action or escalation.',
      activeNodeIds: ids.slice(2, 4),
    },
  ];
};

const normalizePosition = (
  node: DiagramNode,
  index: number,
  total: number,
): { x: number; y: number } => {
  if (node.position) return node.position;
  const cols = total > 6 ? 3 : 2;
  const row = Math.floor(index / cols);
  const col = index % cols;
  const x = 20 + (col * (60 / Math.max(cols - 1, 1)));
  const y = 20 + (row * (60 / Math.max(Math.ceil(total / cols) - 1, 1)));
  return { x, y };
};

export const DecisionLoopScene: React.FC<DecisionLoopSceneProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const accent = scene.accentColor || COLORS.neonCyan;
  const moodColor = getMoodColor(scene.sceneType, scene.moodColor);

  const diagram = scene.visualData as DiagramData | null;
  const nodes = diagram?.nodes || [];
  const edges = diagram?.edges || [];
  const beats = diagram?.beats?.length ? diagram.beats : buildFallbackBeats(diagram);

  const introFrames = Math.min(28, Math.round(durationInFrames * 0.2));
  const loopFrames = Math.max(1, durationInFrames - introFrames);
  const beatWindow = Math.max(30, Math.floor(loopFrames / Math.max(beats.length, 1)));
  const beatIndex = Math.min(
    beats.length - 1,
    Math.max(0, Math.floor((frame - introFrames) / beatWindow)),
  );
  const beat = beats[beatIndex] || beats[0];

  const beatFrame = Math.max(0, frame - introFrames - beatIndex * beatWindow);
  const beatProgress = interpolate(beatFrame, [0, beatWindow], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stageEnter = spring({
    fps,
    frame,
    config: { damping: 18, stiffness: 130, mass: 0.9 },
  });

  const stageOpacity = interpolate(stageEnter, [0, 1], [0, 1]);
  const stageTranslateY = interpolate(stageEnter, [0, 1], [32, 0]);

  const titleEnter = spring({
    fps,
    frame: Math.max(0, frame - 4),
    config: { damping: 20, stiffness: 150 },
  });

  const titleOpacity = interpolate(titleEnter, [0, 1], [0, 1]);
  const titleTranslateX = interpolate(titleEnter, [0, 1], [-18, 0]);

  const stageBox = {
    x: LAYOUT.paddingX,
    y: 320,
    width: LAYOUT.width - LAYOUT.paddingX * 2,
    height: LAYOUT.height - 320 - 320,
  };

  const highlightIds = new Set(beat?.activeNodeIds || []);
  const edgeHighlightIds = new Set(beat?.activeEdgeIds || []);

  const resolveNodePoint = (node: DiagramNode, index: number) => {
    const pos = normalizePosition(node, index, nodes.length);
    return {
      x: stageBox.x + (pos.x / 100) * stageBox.width,
      y: stageBox.y + (pos.y / 100) * stageBox.height,
    };
  };

  const emphasisColor =
    beat?.emphasis === 'execute'
      ? COLORS.success
      : beat?.emphasis === 'escalate'
        ? COLORS.warning
        : accent;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        color: COLORS.textWhite,
        fontFamily: FONTS.primary,
        overflow: 'hidden',
      }}
    >
      <MoodBackground moodColor={moodColor} accentColor={accent} spotlightY={0.4} />

      <div
        style={{
          position: 'absolute',
          top: LAYOUT.safeTop - 26,
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          transform: `translateX(${titleTranslateX}px)`,
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '8px 16px',
            borderRadius: '999px',
            border: `1px solid ${accent}44`,
            background: `linear-gradient(135deg, ${accent}1a, rgba(255,255,255,0.05))`,
            color: accent,
            fontSize: '14px',
            fontWeight: 800,
            letterSpacing: '2.4px',
            textTransform: 'uppercase',
          }}
        >
          Decision loop
        </div>
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: `${FONT_SIZES.title + 18}px`,
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: '-1.6px',
            textTransform: 'uppercase',
            textShadow: EFFECTS.textShadow,
            maxWidth: '820px',
          }}
        >
          {scene.title}
        </div>
        <div
          style={{
            color: COLORS.textMuted,
            fontSize: '22px',
            lineHeight: 1.4,
            maxWidth: '760px',
          }}
        >
          {scene.text}
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          left: stageBox.x,
          top: stageBox.y,
          width: stageBox.width,
          height: stageBox.height,
          transform: `translateY(${stageTranslateY}px)`,
          opacity: stageOpacity,
          borderRadius: '36px',
          border: '1px solid rgba(255,255,255,0.06)',
          background:
            'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
          boxShadow: EFFECTS.panelShadow,
          overflow: 'hidden',
        }}
      >
        <svg
          width={stageBox.width}
          height={stageBox.height}
          viewBox={`0 0 ${stageBox.width} ${stageBox.height}`}
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="10"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 12 4, 0 8" fill={accent} opacity="0.7" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;
            const from = resolveNodePoint(fromNode, nodes.indexOf(fromNode));
            const to = resolveNodePoint(toNode, nodes.indexOf(toNode));
            const localFrom = { x: from.x - stageBox.x, y: from.y - stageBox.y };
            const localTo = { x: to.x - stageBox.x, y: to.y - stageBox.y };
            const edgeId = resolveEdgeId(edge);
            const isActive =
              edgeHighlightIds.has(edgeId) ||
              (highlightIds.has(edge.from) && highlightIds.has(edge.to));
            const stroke = isActive ? emphasisColor : 'rgba(140, 170, 210, 0.22)';
            const width = isActive ? 2.6 : 1.3;
            const opacity = isActive ? 0.95 : 0.45;

            return (
              <g key={edgeId}>
                <line
                  x1={localFrom.x}
                  y1={localFrom.y}
                  x2={localTo.x}
                  y2={localTo.y}
                  stroke={stroke}
                  strokeWidth={width}
                  opacity={opacity}
                  markerEnd="url(#arrowhead)"
                />
                {edge.label ? (
                  <text
                    x={(localFrom.x + localTo.x) / 2}
                    y={(localFrom.y + localTo.y) / 2 - 10}
                    fill={COLORS.textMuted}
                    fontSize="14"
                    fontFamily={FONTS.primary}
                  >
                    {edge.label}
                  </text>
                ) : null}
                {isActive ? (
                  <circle
                    cx={localFrom.x + (localTo.x - localFrom.x) * beatProgress}
                    cy={localFrom.y + (localTo.y - localFrom.y) * beatProgress}
                    r={5}
                    fill={emphasisColor}
                    opacity={0.9}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        {nodes.map((node, index) => {
          const nodePoint = resolveNodePoint(node, index);
          const localX = nodePoint.x - stageBox.x;
          const localY = nodePoint.y - stageBox.y;
          const enter = spring({
            fps,
            frame: Math.max(0, frame - index * 4),
            config: { damping: 16, stiffness: 130, mass: 0.9 },
          });
          const scale = interpolate(enter, [0, 1], [0.96, 1]);
          const baseOpacity = interpolate(enter, [0, 1], [0, 1]);
          const isActive = highlightIds.has(node.id);
          const nodeGlow = isActive
            ? EFFECTS.neonGlow(emphasisColor, 0.7)
            : EFFECTS.neonGlow(accent, 0.2);

          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: localX,
                top: localY,
                transform: `translate(-50%, -50%) scale(${isActive ? 1.06 : scale})`,
                opacity: isActive ? 1 : baseOpacity * 0.6,
                padding: '14px 18px',
                borderRadius: '18px',
                border: `1px solid ${isActive ? emphasisColor : 'rgba(255,255,255,0.12)'}`,
                background:
                  'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: nodeGlow,
                minWidth: '140px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  letterSpacing: '1.8px',
                  textTransform: 'uppercase',
                  color: isActive ? emphasisColor : COLORS.textMuted,
                  fontWeight: 700,
                }}
              >
                {node.type}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  marginTop: '6px',
                  color: COLORS.textWhite,
                }}
              >
                {node.label}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: 'absolute',
          left: LAYOUT.paddingX,
          right: LAYOUT.paddingX,
          bottom: 96,
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: '22px',
          alignItems: 'center',
          opacity: stageOpacity,
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '16px',
            border: `1px solid ${emphasisColor}55`,
            background: `linear-gradient(135deg, ${emphasisColor}1a, rgba(255,255,255,0.04))`,
            color: emphasisColor,
            fontWeight: 700,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            fontSize: '14px',
          }}
        >
          {beat?.chip || beat?.label || 'Stage'}
        </div>
        <div
          style={{
            padding: '18px 22px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.12)',
            background:
              'linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 100%)',
            boxShadow: EFFECTS.panelShadow,
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            {beat?.title || beat?.label}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: COLORS.textMuted,
            }}
          >
            {beat?.detail || scene.subtitle || 'Route the signal through the loop.'}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default DecisionLoopScene;
