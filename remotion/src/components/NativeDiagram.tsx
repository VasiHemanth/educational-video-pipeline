import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Node { id: string; label: string; type: string; }
interface Edge { from: string; to: string; label?: string; }
interface Graph { direction: string; nodes: Node[]; edges: Edge[]; }

export const NativeDiagram: React.FC<{ 
    dsl: string; 
    accent: string; 
    phaseA: number; 
    phaseB: number 
}> = ({ dsl, accent, phaseA, phaseB }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    let graph: Graph;
    try {
        graph = typeof dsl === 'string' ? JSON.parse(dsl) : dsl;
    } catch {
        return <div style={{ color: '#EA4335', fontSize: '24px' }}>Invalid Diagram JSON</div>;
    }

    const isLR = graph.direction !== 'TB';
    const diagramStartFrame = phaseA + phaseB;
    
    // Scale down the entire diagram if there are many nodes to prevent overflow
    const scaleFactor = Math.max(0.6, 1 - (graph.nodes.length - 3) * 0.1);

    return (
        <div style={{
            display: 'flex',
            flexDirection: isLR ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isLR ? '30px' : '20px',
            width: '100%',
            height: '100%',
            transform: `scale(${scaleFactor})`
        }}>
            {graph.nodes.map((node, i) => {
                const appearFrame = diagramStartFrame + (i * 20);
                const nodeSpring = spring({ fps, frame: frame - appearFrame, config: { damping: 14 } });
                const scale = interpolate(nodeSpring, [0, 1], [0.8, 1]);
                const opacity = interpolate(nodeSpring, [0, 1], [0, 1]);

                const hasIncomingEdge = i > 0;
                const edgeLabel = hasIncomingEdge ? graph.edges?.find(e => e.to === node.id && e.from === graph.nodes[i-1].id)?.label : null;

                return (
                    <React.Fragment key={node.id}>
                        {hasIncomingEdge && (
                            <div style={{
                                opacity: interpolate(spring({ fps, frame: frame - appearFrame + 10 }), [0, 1], [0, 1]),
                                display: 'flex',
                                flexDirection: isLR ? 'row' : 'column',
                                alignItems: 'center',
                                position: 'relative'
                            }}>
                                {edgeLabel && (
                                    <div style={{
                                        position: 'absolute',
                                        top: isLR ? '-35px' : 'auto',
                                        left: isLR ? 'auto' : '25px',
                                        color: '#A1A1A6',
                                        fontSize: '20px',
                                        fontWeight: 600,
                                        letterSpacing: '1px',
                                        whiteSpace: 'nowrap',
                                        textTransform: 'uppercase'
                                    }}>
                                        {edgeLabel}
                                    </div>
                                )}
                                <div style={{
                                    width: isLR ? '60px' : '4px',
                                    height: isLR ? '4px' : '60px',
                                    backgroundColor: '#48484A',
                                    borderRadius: '2px'
                                }} />
                                <div style={{
                                    width: 0, height: 0,
                                    borderTop: isLR ? '12px solid transparent' : 'none',
                                    borderBottom: isLR ? '12px solid transparent' : 'none',
                                    borderLeft: isLR ? '18px solid #48484A' : '12px solid transparent',
                                    borderRight: isLR ? 'none' : '12px solid transparent',
                                    borderTopColor: isLR ? 'transparent' : '#48484A',
                                    marginTop: isLR ? 0 : '-4px',
                                    marginLeft: isLR ? '-4px' : 0
                                }} />
                            </div>
                        )}
                        <div style={{
                            transform: `scale(${scale})`,
                            opacity,
                            padding: '30px 40px',
                            backgroundColor: 'transparent',
                            border: `3px solid ${accent}`,
                            borderRadius: node.type === 'database' || node.type === 'storage' ? '40px' : '16px',
                            color: '#F5F5F7',
                            fontSize: '36px',
                            fontWeight: 700,
                            boxShadow: `inset 0 0 20px ${accent}20, 0 0 30px ${accent}30`,
                            textAlign: 'center',
                            minWidth: '220px',
                            maxWidth: '380px',
                            wordBreak: 'break-word',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {node.label}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
