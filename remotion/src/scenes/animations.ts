import { interpolate, spring } from 'remotion';
import { Animation, LoopAnimation } from './types';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };

/**
 * Compute CSS properties for an enter/exit animation at a given frame.
 * Returns { opacity, transform, filter } to spread onto a style object.
 */
export function computeAnimation(
    anim: Animation | undefined,
    frame: number,
    fps: number,
    totalDuration: number,
    direction: 'enter' | 'exit' = 'enter',
): React.CSSProperties {
    if (!anim || anim.type === 'none') return {};

    const delay = anim.delay ?? 0;
    const duration = anim.duration ?? 20;
    const localFrame = frame - delay;
    const springCfg = anim.spring ?? { damping: 60, stiffness: 100 };

    // For exit animations, compute from end of scene
    const exitStart = totalDuration - delay - duration;
    const exitFrame = direction === 'exit' ? frame - exitStart : localFrame;

    if (direction === 'exit') {
        if (frame < exitStart) return {};
        const progress = interpolate(exitFrame, [0, duration], [1, 0], clamp);

        switch (anim.type) {
            case 'fade-out':
                return { opacity: progress };
            case 'scale-out':
                return { opacity: progress, transform: `scale(${0.5 + progress * 0.5})` };
            case 'blur-out':
                return { filter: `blur(${(1 - progress) * 15}px)`, opacity: progress };
            case 'slide-down':
                return { transform: `translateY(${(1 - progress) * 60}px)`, opacity: progress };
            case 'slide-up':
                return { transform: `translateY(${-(1 - progress) * 60}px)`, opacity: progress };
            case 'slide-left':
                return { transform: `translateX(${-(1 - progress) * 100}px)`, opacity: progress };
            case 'slide-right':
                return { transform: `translateX(${(1 - progress) * 100}px)`, opacity: progress };
            default:
                return { opacity: progress };
        }
    }

    // Enter animations
    if (localFrame < 0) return { opacity: 0 };

    const s = spring({ fps, frame: localFrame, config: springCfg });
    const linear = interpolate(localFrame, [0, duration], [0, 1], clamp);

    switch (anim.type) {
        case 'fade-in':
            return { opacity: linear };
        case 'slide-up':
            return { transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px)`, opacity: s };
        case 'slide-down':
            return { transform: `translateY(${interpolate(s, [0, 1], [-50, 0])}px)`, opacity: s };
        case 'slide-left':
            return { transform: `translateX(${interpolate(s, [0, 1], [80, 0])}px)`, opacity: s };
        case 'slide-right':
            return { transform: `translateX(${interpolate(s, [0, 1], [-80, 0])}px)`, opacity: s };
        case 'scale-in':
            return { transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`, opacity: s };
        case 'blur-in': {
            const blur = interpolate(s, [0, 1], [18, 0]);
            return { filter: `blur(${blur}px)`, opacity: s };
        }
        case 'pop': {
            const popSpring = spring({ fps, frame: localFrame, config: { damping: 10, stiffness: 200 } });
            return { transform: `scale(${interpolate(popSpring, [0, 1], [0, 1])})`, opacity: Math.min(1, localFrame / 3) };
        }
        default:
            return { opacity: linear };
    }
}

/**
 * Compute CSS properties for a looping animation.
 */
export function computeLoop(
    loop: LoopAnimation | undefined,
    frame: number,
): React.CSSProperties {
    if (!loop || loop.type === 'none') return {};

    const intensity = loop.intensity ?? 0.3;
    const speed = loop.speed ?? 30;
    const t = Math.sin(frame / speed * Math.PI);

    switch (loop.type) {
        case 'pulse':
            return { transform: `scale(${1 + t * intensity * 0.1})` };
        case 'float':
            return { transform: `translateY(${t * intensity * 10}px)` };
        case 'glow':
            return { opacity: 0.7 + t * intensity * 0.3 };
        case 'breathe':
            return {
                transform: `scale(${1 + t * intensity * 0.05})`,
                opacity: 0.8 + t * intensity * 0.2,
            };
        default:
            return {};
    }
}

/**
 * Resolve position to absolute CSS coordinates.
 * Canvas: 1080x1920
 */
export function resolvePosition(pos: { x: number | string; y: number | string; anchor?: string; width?: number | string }): React.CSSProperties {
    const W = 1080;
    const H = 1920;

    let left: number | string = 0;
    let top: number | string = 0;
    let transform = '';

    if (pos.x === 'center') { left = W / 2; transform += 'translateX(-50%) '; }
    else if (pos.x === 'left') { left = 80; }
    else if (pos.x === 'right') { left = W - 80; transform += 'translateX(-100%) '; }
    else { left = pos.x as number; }

    if (pos.y === 'center') { top = H / 2; transform += 'translateY(-50%) '; }
    else if (pos.y === 'top') { top = 200; }
    else if (pos.y === 'bottom') { top = H - 200; }
    else { top = pos.y as number; }

    const result: React.CSSProperties = {
        position: 'absolute',
        left,
        top,
    };

    if (transform.trim()) result.transform = transform.trim();
    if (pos.width) result.width = pos.width;

    return result;
}
