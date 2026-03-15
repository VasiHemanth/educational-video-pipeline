/**
 * GrainOverlay — Subtle film grain texture overlay
 *
 * Extracted from MotivationReel.tsx for reuse across all compositions.
 * Adds a premium cinematic / analog texture to the dark background.
 */

import React from 'react';
import { Img } from 'remotion';

interface GrainOverlayProps {
  opacity?: number;
}

const GRAIN_TEXTURE =
  "data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E";

export const GrainOverlay: React.FC<GrainOverlayProps> = ({ opacity = 0.04 }) => (
  <Img
    src={GRAIN_TEXTURE}
    alt=""
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      opacity,
      pointerEvents: 'none',
      objectFit: 'cover',
      zIndex: 1,
    }}
  />
);

export default GrainOverlay;
