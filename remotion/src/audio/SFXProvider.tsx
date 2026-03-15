/**
 * SFXProvider — Centralized Sound Effects Orchestrator
 *
 * Takes a list of SFXEvents (defined by the assembler or LLM)
 * and renders Remotion <Audio> components exactly at the requested frames.
 *
 * IMPORTANT: All SFX events use sourceUrl (base64 data URI) from the assembler.
 * Static file references are intentionally removed — the assembler encodes
 * audio files as data URIs before passing them. If sourceUrl is missing,
 * the event is silently skipped (graceful degradation).
 */

import React from 'react';
import { Sequence, Audio } from 'remotion';
import { SFXEvent } from '../EducationalTypes';

interface SFXProviderProps {
  events: SFXEvent[];
  /** Optional fallback volume multiplier */
  masterVolume?: number;
}

export const SFXProvider: React.FC<SFXProviderProps> = ({ events, masterVolume = 1.0 }) => {
  // Only render events that have a sourceUrl (base64 data URI from assembler)
  // Events without sourceUrl are silently skipped — no 404 crashes
  const validEvents = (events || []).filter(e => e.sourceUrl && e.sourceUrl.length > 0);

  if (validEvents.length === 0) return null;

  return (
    <>
      {validEvents.map((event, index) => {
        const volume = (event.volume ?? 1.0) * masterVolume;
        return (
          <Sequence key={`sfx-${index}-${event.frame}`} from={Math.max(0, event.frame)}>
            <Audio src={event.sourceUrl!} volume={volume} />
          </Sequence>
        );
      })}
    </>
  );
};

export default SFXProvider;
