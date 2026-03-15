/**
 * sfx_scheduler.js — Scene-Type-Aware SFX Choreography
 *
 * Schedules precise audio events based on the new 5-act scene taxonomy.
 * Each scene type gets a unique SFX signature that plays at the exact
 * frame when visual elements appear.
 */

// SFX type to file map (also used by SFXProvider)
const SFX_TYPES = {
  // Classic sounds
  WHOOSH:    'whoosh',
  WHIP:      'whip',
  POP:       'pop',
  DING:      'ding',
  // New sounds for cinematic scenes
  TICK:         'tick',
  BASS_RUMBLE:  'bass_rumble',
  ERROR_BUZZ:   'error_buzz',
  EDGE_HUM:     'edge_hum',
  CONFIRM_CHIME:'confirm_chime',
};

// Animation stagger in frames (must match Remotion component constants)
const NODE_STAGGER = 20;  // Frames between each diagram node/card
const STEP_STAGGER = 22;  // Frames between each timeline step

function buildSFXTrack(content, timings) {
  const events = [];

  content.scenes.forEach((scene, index) => {
    const timing = timings.find(t => t.id === scene.id);
    if (!timing) return;

    const sceneStart = timing.startFrame;

    // ── 1. Scene transition sound (every scene after the first) ──────────────
    if (index > 0) {
      const transStyle = scene.transitionStyle;
      if (transStyle === 'flash') {
        events.push({ frame: sceneStart, sfxType: SFX_TYPES.WHIP, volume: 0.7 });
      } else {
        events.push({ frame: sceneStart, sfxType: SFX_TYPES.WHOOSH, volume: 0.45 });
      }
    }

    // ── 2. Scene-type specific SFX signatures ─────────────────────────────────

    switch (scene.sceneType) {

      case 'ticker_hook': {
        // Bass rumble immediately on hook entry
        events.push({ frame: sceneStart + 1, sfxType: SFX_TYPES.BASS_RUMBLE, volume: 0.65 });
        // Tick sounds for stat counter (frames 5-30, every 3 frames)
        const data = scene.visualData;
        if (data?.hookStyle === 'stat' && data?.stat) {
          const statNum = parseFloat(String(data.stat).replace(/[^0-9.]/g, '')) || 10;
          const ticks = Math.min(Math.floor(statNum), 8); // Max 8 ticks
          for (let t = 0; t < ticks; t++) {
            events.push({
              frame: sceneStart + 6 + t * 3,
              sfxType: SFX_TYPES.TICK,
              volume: 0.3 + (t / ticks) * 0.3, // Gets louder as number rises
            });
          }
        }
        // Whip on reveal word
        events.push({ frame: sceneStart + 20, sfxType: SFX_TYPES.WHIP, volume: 0.8 });
        break;
      }

      case 'pain_chaos':
      case 'problem': {
        // Error buzz for each chaos X item
        const problems = scene.visualData?.problems || [];
        problems.slice(0, 5).forEach((_, i) => {
          events.push({
            frame: sceneStart + 15 + i * 18,
            sfxType: SFX_TYPES.ERROR_BUZZ,
            volume: 0.4,
          });
        });
        break;
      }

      case 'timeline_steps': {
        // Tick for each step sliding in
        const steps = scene.visualData?.steps || [];
        steps.slice(0, 4).forEach((_, i) => {
          events.push({
            frame: sceneStart + 18 + i * STEP_STAGGER,
            sfxType: SFX_TYPES.TICK,
            volume: 0.5,
          });
        });
        break;
      }

      case 'decision_loop': {
        const beats = scene.visualData?.beats || [];
        const beatCount = Math.max(1, beats.length);
        const beatWindow = Math.max(24, Math.floor(timing.durationFrames / beatCount));

        beats.forEach((beat, i) => {
          const beatFrame = sceneStart + 12 + i * beatWindow;
          events.push({
            frame: beatFrame,
            sfxType: SFX_TYPES.TICK,
            volume: 0.4,
          });

          if (beat.emphasis === 'execute') {
            events.push({
              frame: beatFrame + 8,
              sfxType: SFX_TYPES.DING,
              volume: 0.55,
            });
          }

          if (beat.emphasis === 'escalate') {
            events.push({
              frame: beatFrame + 8,
              sfxType: SFX_TYPES.CONFIRM_CHIME,
              volume: 0.5,
            });
          }
        });
        break;
      }

      case 'reveal_diagram':
      case 'solution':
      case 'concept': {
        const visualStart = sceneStart + (timing.phaseText || 60) + (timing.phaseVisual || 15);

        if (scene.visualFormat === 'diagram' && scene.visualData?.nodes) {
          // Edge hum as diagram starts assembling
          events.push({ frame: visualStart, sfxType: SFX_TYPES.EDGE_HUM, volume: 0.35 });
          // Pop for each node
          scene.visualData.nodes.forEach((_, nodeIndex) => {
            events.push({
              frame: visualStart + nodeIndex * NODE_STAGGER,
              sfxType: SFX_TYPES.POP,
              volume: 0.4,
            });
          });
        }

        if (scene.visualFormat === 'card_stack' && scene.visualData?.cards) {
          scene.visualData.cards.forEach((_, i) => {
            events.push({
              frame: visualStart + i * NODE_STAGGER,
              sfxType: SFX_TYPES.POP,
              volume: 0.45,
            });
          });
        }

        if (scene.visualFormat === 'split_compare') {
          events.push({ frame: visualStart + 10, sfxType: SFX_TYPES.POP, volume: 0.4 });
          events.push({ frame: visualStart + 40, sfxType: SFX_TYPES.DING, volume: 0.5 });
        }
        break;
      }

      case 'identity_cta':
      case 'cta': {
        // Warm confirmation chime on entry
        events.push({ frame: sceneStart + 10, sfxType: SFX_TYPES.CONFIRM_CHIME, volume: 0.7 });
        break;
      }

      case 'synthesis': {
        events.push({ frame: sceneStart + 15, sfxType: SFX_TYPES.DING, volume: 0.85 });
        break;
      }

      case 'hook': {
        events.push({ frame: sceneStart + 5, sfxType: SFX_TYPES.WHIP, volume: 0.75 });
        break;
      }
    }
  });

  return events;
}

module.exports = { buildSFXTrack };
