import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { DiagramData, DiagramNode } from '../EducationalTypes';
import { COLORS, EFFECTS, FONTS } from '../design/theme';

type LayoutMode = 'LR' | 'TB' | 'GRID';

const NODE_TYPE_STYLES: Record<
  string,
  { chip: string; gradient: string; emoji: string }
> = {
  compute: {
    chip: 'compute',
    gradient: 'linear-gradient(135deg, rgba(17,39,66,0.92), rgba(14,28,45,0.92))',
    emoji: '⚡',
  },
  process: {
    chip: 'process',
    gradient: 'linear-gradient(135deg, rgba(20,38,60,0.92), rgba(11,22,38,0.92))',
    emoji: '🔄',
  },
  storage: {
    chip: 'storage',
    gradient: 'linear-gradient(135deg, rgba(18,48,68,0.92), rgba(10,28,39,0.92))',
    emoji: '💾',
  },
  database: {
    chip: 'database',
    gradient: 'linear-gradient(135deg, rgba(16,52,72,0.92), rgba(11,29,42,0.92))',
    emoji: '🗄️',
  },
  messaging: {
    chip: 'message',
    gradient: 'linear-gradient(135deg, rgba(33,32,74,0.92), rgba(17,20,44,0.92))',
    emoji: '📨',
  },
  user: {
    chip: 'user',
    gradient: 'linear-gradient(135deg, rgba(45,38,78,0.92), rgba(20,19,44,0.92))',
    emoji: '👤',
  },
  decision: {
    chip: 'decision',
    gradient: 'linear-gradient(135deg, rgba(35,51,31,0.92), rgba(15,30,17,0.92))',
    emoji: '🔀',
  },
};

const NODE_STAGGER = 12;
const ARROW_DELAY = 6;
const ARROW_DRAW_FRAMES = 14;
const ACTIVE_HOLD_FRAMES = 24;

const hexToRgb = (hex: string): string => {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

const computeLayout = (data: DiagramData): LayoutMode => {
  if (data.nodes.length >= 7) return 'GRID';
  if (data.direction === 'LR' && data.nodes.length <= 4) return 'LR';
  return 'TB';
};

const getNodeSizing = (nodeCount: number, layout: LayoutMode) => {
  if (layout === 'LR') {
    return {
      fontSize: 26,
      chipSize: 12,
      gap: 26,
      minW: 190,
      maxW: 240,
      cardWidth: 240,
      padV: 18,
      padH: 18,
      iconSize: 30,
    };
  }

  if (layout === 'GRID') {
    return {
      fontSize: 20,
      chipSize: 11,
      gap: 18,
      minW: 188,
      maxW: 220,
      cardWidth: 220,
      padV: 14,
      padH: 16,
      iconSize: 24,
    };
  }

  return {
    fontSize: nodeCount <= 4 ? 28 : 24,
    chipSize: 12,
    gap: nodeCount <= 4 ? 22 : 18,
    minW: nodeCount <= 4 ? 280 : 240,
    maxW: nodeCount <= 4 ? 560 : 420,
    cardWidth: nodeCount <= 4 ? 620 : 560,
    padV: nodeCount <= 4 ? 18 : 16,
    padH: nodeCount <= 4 ? 22 : 18,
    iconSize: nodeCount <= 4 ? 30 : 26,
  };
};

const getNodeStyle = (type: string) => {
  return NODE_TYPE_STYLES[type] || NODE_TYPE_STYLES.process;
};

interface DynamicDiagramProps {
  data: DiagramData;
  accent?: string;
  startFrame?: number;
}

export const DynamicDiagram: React.FC<DynamicDiagramProps> = ({
  data,
  accent = COLORS.neonCyan,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relFrame = frame - startFrame;

  if (!data?.nodes?.length) {
    return null;
  }

  const layout = computeLayout(data);
  const sizing = getNodeSizing(data.nodes.length, layout);

  if (layout === 'GRID') {
    const columns = data.nodes.length > 8 ? 3 : 2;

    return (
      <DiagramStage accent={accent} layout={layout} nodeCount={data.nodes.length}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, minmax(${sizing.minW}px, ${sizing.maxW}px))`,
            gap: `${sizing.gap}px`,
            justifyContent: 'center',
            alignContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          {data.nodes.map((node) => (
            <GhostNode
              key={`${node.id}-ghost`}
              accent={accent}
              node={node}
              sizing={sizing}
            />
          ))}
          {data.nodes.map((node, index) => (
            <AnimatedNode
              key={node.id}
              accent={accent}
              fps={fps}
              node={node}
              nodeIndex={index}
              relFrame={relFrame}
              sizing={sizing}
              startFrame={index * NODE_STAGGER}
            />
          ))}
        </div>
      </DiagramStage>
    );
  }

  const isLR = layout === 'LR';

  return (
    <DiagramStage accent={accent} layout={layout} nodeCount={data.nodes.length}>
      <div
        style={{
          display: 'flex',
          flexDirection: isLR ? 'row' : 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${sizing.gap}px`,
          width: isLR ? '100%' : 'min(100%, 700px)',
          height: '100%',
        }}
      >
        {data.nodes.map((node, index) => {
          const incomingEdge =
            index > 0
              ? data.edges?.find(
                  (edge) =>
                    edge.to === node.id && edge.from === data.nodes[index - 1].id,
                )
              : null;

          return (
            <React.Fragment key={node.id}>
              {index > 0 ? (
                <>
                  <GhostArrow accent={accent} isLR={isLR} label={incomingEdge?.label} />
                  <AnimatedArrow
                    accent={accent}
                    isLR={isLR}
                    label={incomingEdge?.label}
                    relFrame={relFrame}
                    startFrame={index * NODE_STAGGER + ARROW_DELAY}
                  />
                </>
              ) : null}
              <GhostNode
                accent={accent}
                node={node}
                sizing={sizing}
                stretch={!isLR}
              />
              <AnimatedNode
                accent={accent}
                fps={fps}
                node={node}
                nodeIndex={index}
                relFrame={relFrame}
                sizing={sizing}
                startFrame={index * NODE_STAGGER}
                stretch={!isLR}
              />
            </React.Fragment>
          );
        })}
      </div>
    </DiagramStage>
  );
};

const GhostNode: React.FC<{
  node: DiagramNode;
  accent: string;
  sizing: ReturnType<typeof getNodeSizing>;
  stretch?: boolean;
}> = ({ node, accent, sizing, stretch = false }) => {
  const style = getNodeStyle(node.type);
  const accentRgb = hexToRgb(accent);

  return (
    <div
      style={{
        position: 'relative',
        width: stretch ? `min(100%, ${sizing.cardWidth || sizing.maxW}px)` : undefined,
        minWidth: stretch ? undefined : `${sizing.minW}px`,
        maxWidth: stretch ? undefined : `${sizing.maxW}px`,
        padding: `${sizing.padV}px ${sizing.padH}px`,
        borderRadius: '24px',
        border: `1px dashed rgba(${accentRgb}, 0.12)`,
        background: `linear-gradient(165deg, rgba(${accentRgb}, 0.08), rgba(255,255,255,0.03))`,
        boxShadow: `inset 0 0 30px rgba(${accentRgb}, 0.05)`,
        opacity: 0.58,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '7px 10px',
            borderRadius: '999px',
            background: `rgba(${accentRgb}, 0.06)`,
            border: `1px solid rgba(${accentRgb}, 0.08)`,
            color: accent,
            fontSize: `${sizing.chipSize}px`,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {style.chip}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: `${sizing.iconSize + 18}px`,
              height: `${sizing.iconSize + 18}px`,
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(${accentRgb}, 0.08)`,
              border: `1px solid rgba(${accentRgb}, 0.1)`,
              flexShrink: 0,
              fontSize: `${sizing.iconSize}px`,
              opacity: 0.62,
            }}
          >
            {node.iconName || style.emoji}
          </div>

          <div
            style={{
              color: COLORS.textWhite,
              fontSize: `${sizing.fontSize}px`,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.3px',
              fontFamily: FONTS.primary,
              opacity: 0.42,
            }}
          >
            {node.label}
          </div>
        </div>
      </div>
    </div>
  );
};

const DiagramStage: React.FC<{
  accent: string;
  layout: LayoutMode;
  nodeCount: number;
  children: React.ReactNode;
}> = ({
  accent,
  layout,
  nodeCount,
  children,
}) => {
  const accentRgb = hexToRgb(accent);
  const isTB = layout === 'TB';
  const isLR = layout === 'LR';
  const slotCount = Math.min(nodeCount, 6);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '30px',
        overflow: 'hidden',
        padding: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'linear-gradient(165deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            `radial-gradient(circle 360px at 14% 12%, rgba(${accentRgb}, 0.16) 0%, transparent 72%)`,
            `radial-gradient(circle 440px at 82% 88%, rgba(${accentRgb}, 0.08) 0%, transparent 74%)`,
            'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 30%)',
          ].join(', '),
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: [
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0 1px, transparent 1px 34px)',
            'repeating-linear-gradient(180deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 34px)',
          ].join(', '),
          opacity: 0.28,
        }}
      />

      {isTB ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 56,
              bottom: 56,
              left: '50%',
              width: '2px',
              transform: 'translateX(-50%)',
              background: `linear-gradient(180deg, rgba(${accentRgb}, 0.12), rgba(${accentRgb}, 0.5), rgba(${accentRgb}, 0.12))`,
              boxShadow: `0 0 22px rgba(${accentRgb}, 0.16)`,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 72,
              bottom: 72,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: slotCount }).map((_, index) => (
              <div
                key={`tb-slot-${index}`}
                style={{
                  width: index === Math.floor(slotCount / 2) ? '16px' : '12px',
                  height: index === Math.floor(slotCount / 2) ? '16px' : '12px',
                  borderRadius: '999px',
                  border: `1px solid rgba(${accentRgb}, 0.34)`,
                  background: `rgba(${accentRgb}, ${index === Math.floor(slotCount / 2) ? 0.28 : 0.16})`,
                  boxShadow: `0 0 ${index === Math.floor(slotCount / 2) ? 18 : 12}px rgba(${accentRgb}, 0.22)`,
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      {isLR ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 56,
              right: 56,
              top: '50%',
              height: '2px',
              transform: 'translateY(-50%)',
              background: `linear-gradient(90deg, rgba(${accentRgb}, 0.12), rgba(${accentRgb}, 0.5), rgba(${accentRgb}, 0.12))`,
              boxShadow: `0 0 22px rgba(${accentRgb}, 0.16)`,
              opacity: 0.9,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 72,
              right: 72,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            {Array.from({ length: slotCount }).map((_, index) => (
              <div
                key={`lr-slot-${index}`}
                style={{
                  width: index === Math.floor(slotCount / 2) ? '16px' : '12px',
                  height: index === Math.floor(slotCount / 2) ? '16px' : '12px',
                  borderRadius: '999px',
                  border: `1px solid rgba(${accentRgb}, 0.34)`,
                  background: `rgba(${accentRgb}, ${index === Math.floor(slotCount / 2) ? 0.28 : 0.16})`,
                  boxShadow: `0 0 ${index === Math.floor(slotCount / 2) ? 18 : 12}px rgba(${accentRgb}, 0.22)`,
                }}
              />
            ))}
          </div>
        </>
      ) : null}

      <div
        style={{
          position: 'absolute',
          top: 18,
          right: 22,
          color: COLORS.textMuted,
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '2.2px',
          textTransform: 'uppercase',
        }}
      >
        Signal Flow
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const AnimatedNode: React.FC<{
  node: DiagramNode;
  accent: string;
  sizing: ReturnType<typeof getNodeSizing>;
  startFrame: number;
  relFrame: number;
  fps: number;
  nodeIndex: number;
  stretch?: boolean;
}> = ({ node, accent, sizing, startFrame, relFrame, fps, nodeIndex, stretch = false }) => {
  const style = getNodeStyle(node.type);
  const accentRgb = hexToRgb(accent);

  const revealSpring = spring({
    fps,
    frame: relFrame - startFrame,
    config: { damping: 15, stiffness: 170, mass: 0.8 },
  });

  const opacity = interpolate(revealSpring, [0, 1], [0, 1]);
  const scale = interpolate(revealSpring, [0, 1], [0.74, 1]);
  const translate = interpolate(revealSpring, [0, 1], [36, 0]);

  const activeStart = startFrame + 10;
  const activeEnd = activeStart + ACTIVE_HOLD_FRAMES;
  const glow = interpolate(
    relFrame,
    [activeStart, activeStart + 6, activeEnd - 8, activeEnd],
    [0.2, 1, 0.95, 0.38],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const ringScale = 1.02 + (Math.sin((relFrame - activeStart) * 0.18) * 0.5 + 0.5) * 0.08;

  return (
    <div
      style={{
        position: 'relative',
        transform: `translateY(${translate}px) scale(${scale})`,
        opacity,
        width: stretch ? `min(100%, ${sizing.cardWidth || sizing.maxW}px)` : undefined,
        minWidth: stretch ? undefined : `${sizing.minW}px`,
        maxWidth: stretch ? undefined : `${sizing.maxW}px`,
        padding: `${sizing.padV}px ${sizing.padH}px`,
        borderRadius: '24px',
        border: `1px solid rgba(${accentRgb}, ${0.24 + glow * 0.42})`,
        background: style.gradient,
        boxShadow: [
          `0 0 ${24 * glow}px rgba(${accentRgb}, ${0.16 + glow * 0.2})`,
          `inset 0 0 24px rgba(${accentRgb}, ${0.06 + glow * 0.08})`,
          EFFECTS.panelShadow,
        ].join(', '),
        backdropFilter: 'blur(14px)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 32%, transparent 100%)',
          opacity: 0.5,
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            padding: '7px 10px',
            borderRadius: '999px',
            background: `rgba(${accentRgb}, 0.12)`,
            border: `1px solid rgba(${accentRgb}, 0.2)`,
            color: accent,
            fontSize: `${sizing.chipSize}px`,
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          {style.chip}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: `${sizing.iconSize + 18}px`,
              height: `${sizing.iconSize + 18}px`,
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(${accentRgb}, 0.14)`,
              border: `1px solid rgba(${accentRgb}, 0.24)`,
              boxShadow: EFFECTS.neonGlow(accent, 0.25),
              flexShrink: 0,
              fontSize: `${sizing.iconSize}px`,
            }}
          >
            {node.iconName || style.emoji}
          </div>

          <div
            style={{
              color: COLORS.textWhite,
              fontSize: `${sizing.fontSize}px`,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.4px',
              fontFamily: FONTS.primary,
              textShadow: '0 2px 10px rgba(0,0,0,0.28)',
            }}
          >
            {node.label}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          right: 14,
          bottom: 12,
          color: 'rgba(255,255,255,0.14)',
          fontSize: '12px',
          fontWeight: 800,
          letterSpacing: '1.8px',
          textTransform: 'uppercase',
        }}
      >
        n{nodeIndex + 1}
      </div>

      <div
        style={{
          position: 'absolute',
          inset: '-4px',
          borderRadius: '28px',
          border: `1px solid rgba(${accentRgb}, ${0.18 + glow * 0.18})`,
          transform: `scale(${ringScale})`,
          opacity: glow,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

const AnimatedArrow: React.FC<{
  isLR: boolean;
  accent: string;
  label?: string;
  startFrame: number;
  relFrame: number;
}> = ({ isLR, accent, label, startFrame, relFrame }) => {
  const drawProgress = interpolate(
    relFrame,
    [startFrame, startFrame + ARROW_DRAW_FRAMES],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
  );
  const accentRgb = hexToRgb(accent);
  const shaftLen = isLR ? 64 : 58;
  const headSize = 10;
  const pulseFrames = [0, 18];

  const renderPulse = (index: number) => {
    const pulseFrame = relFrame - (startFrame + ARROW_DRAW_FRAMES + pulseFrames[index]);
    if (pulseFrame < 0) return null;

    const cycle = 40;
    const travel = (pulseFrame % cycle) / cycle;
    const pulseOpacity = 0.25 + (1 - travel) * 0.55;
    const blur = 2 + (1 - travel) * 2;

    if (isLR) {
      return (
        <circle
          key={`pulse-${index}`}
          cx={shaftLen * travel}
          cy={headSize + 3}
          r={4.6}
          fill={accent}
          opacity={pulseOpacity}
          filter={`blur(${blur}px)`}
        />
      );
    }

    return (
      <circle
        key={`pulse-${index}`}
        cx={headSize + 3}
        cy={shaftLen * travel}
        r={4.6}
        fill={accent}
        opacity={pulseOpacity}
        filter={`blur(${blur}px)`}
      />
    );
  };

  if (isLR) {
    const height = headSize * 2 + 6;

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${shaftLen + headSize + 4}px`,
        }}
      >
        {label ? (
          <div
            style={{
              position: 'absolute',
              top: '-22px',
              left: '50%',
              transform: 'translateX(-50%)',
              color: COLORS.textMuted,
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </div>
        ) : null}
        <svg width={shaftLen + headSize + 4} height={height} style={{ overflow: 'visible' }}>
          <line
            x1={0}
            y1={height / 2}
            x2={shaftLen}
            y2={height / 2}
            stroke={`rgba(${accentRgb}, 0.28)`}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={shaftLen}
            strokeDashoffset={shaftLen * (1 - drawProgress)}
          />
          <line
            x1={0}
            y1={height / 2}
            x2={shaftLen * drawProgress}
            y2={height / 2}
            stroke={accent}
            strokeWidth={5}
            strokeLinecap="round"
            opacity={0.6}
            filter="blur(3px)"
          />
          {pulseFrames.map((_, index) => renderPulse(index))}
          <polygon
            points={`${shaftLen},${height / 2 - headSize} ${shaftLen},${height / 2 + headSize} ${
              shaftLen + headSize
            },${height / 2}`}
            fill={accent}
            opacity={interpolate(drawProgress, [0.55, 1], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}
          />
        </svg>
      </div>
    );
  }

  const width = headSize * 2 + 6;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        height: `${shaftLen + headSize + 4}px`,
      }}
    >
      {label ? (
        <div
          style={{
            position: 'absolute',
            left: '18px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: COLORS.textMuted,
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          {label}
        </div>
      ) : null}
      <svg width={width} height={shaftLen + headSize + 4} style={{ overflow: 'visible' }}>
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={shaftLen}
          stroke={`rgba(${accentRgb}, 0.28)`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray={shaftLen}
          strokeDashoffset={shaftLen * (1 - drawProgress)}
        />
        <line
          x1={width / 2}
          y1={0}
          x2={width / 2}
          y2={shaftLen * drawProgress}
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.6}
          filter="blur(3px)"
        />
        {pulseFrames.map((_, index) => renderPulse(index))}
        <polygon
          points={`${width / 2 - headSize},${shaftLen} ${width / 2 + headSize},${shaftLen} ${
            width / 2
          },${shaftLen + headSize}`}
          fill={accent}
          opacity={interpolate(drawProgress, [0.55, 1], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          })}
        />
      </svg>
    </div>
  );
};

const GhostArrow: React.FC<{
  isLR: boolean;
  accent: string;
  label?: string;
}> = ({ isLR, accent, label }) => {
  const accentRgb = hexToRgb(accent);
  const shaftLen = isLR ? 64 : 58;
  const headSize = 10;

  if (isLR) {
    const height = headSize * 2 + 6;

    return (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          width: `${shaftLen + headSize + 4}px`,
          height: `${height}px`,
          opacity: 0.4,
        }}
      >
        <svg width={shaftLen + headSize + 4} height={height} viewBox={`0 0 ${shaftLen + headSize + 4} ${height}`}>
          <line
            x1="0"
            y1={headSize + 3}
            x2={shaftLen}
            y2={headSize + 3}
            stroke={`rgba(${accentRgb}, 0.28)`}
            strokeWidth="2.5"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
          <path
            d={`M ${shaftLen - 1} ${3} L ${shaftLen + headSize} ${headSize + 3} L ${shaftLen - 1} ${height - 3}`}
            fill="none"
            stroke={`rgba(${accentRgb}, 0.28)`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {label ? (
          <div
            style={{
              position: 'absolute',
              top: '-18px',
              color: COLORS.textMuted,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1.6px',
              textTransform: 'uppercase',
              opacity: 0.6,
            }}
          >
            {label}
          </div>
        ) : null}
      </div>
    );
  }

  const width = headSize * 2 + 6;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        width: `${width}px`,
        height: `${shaftLen + headSize + 4}px`,
        opacity: 0.4,
      }}
    >
      <svg width={width} height={shaftLen + headSize + 4} viewBox={`0 0 ${width} ${shaftLen + headSize + 4}`}>
        <line
          x1={headSize + 3}
          y1="0"
          x2={headSize + 3}
          y2={shaftLen}
          stroke={`rgba(${accentRgb}, 0.28)`}
          strokeWidth="2.5"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
        <path
          d={`M ${3} ${shaftLen - 1} L ${headSize + 3} ${shaftLen + headSize} L ${width - 3} ${shaftLen - 1}`}
          fill="none"
          stroke={`rgba(${accentRgb}, 0.28)`}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label ? (
        <div
          style={{
            position: 'absolute',
            right: '-52px',
            color: COLORS.textMuted,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1.6px',
            textTransform: 'uppercase',
            opacity: 0.6,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

export default DynamicDiagram;
