#!/usr/bin/env python3
"""
Voice Generation Script — Qwen3 TTS 1.7B CustomVoice (Fixed Speaker)
═════════════════════════════════════════════════════════════════════
Generates per-section WAV files from a pipeline content JSON using a
FIXED speaker identity for consistent voice across all sections.

Key fix for voice consistency:
  - Uses CustomVoice model (fixed pre-trained speakers, not generative VoiceDesign)
  - Sets mx.random.seed() globally before generation for reproducible prosody
  - temperature=0.3 for stable, deterministic prosody
  - Same speaker + instruct for every segment → identical timbre

Usage:
    python scripts/generate_voice.py --question 11 --content output_prod/q11_content.json
    python scripts/generate_voice.py --question 11 --content output_prod/q11_content.json --voice ethan_professional

Requires:
    - mlx_audio (pip install mlx-audio)
"""

import argparse
import json
import os
import subprocess
import sys
import time
import wave

# ── Set global reproducibility seed BEFORE any model imports ──────────────────
# This ensures MLX's random state is identical on every run, so that even
# prosody/intonation sampling is reproducible across all sections.
import mlx.core as mx
mx.random.seed(42)

# ── Configuration ──────────────────────────────────────────────────────────────

# CustomVoice model — uses fixed pre-trained speakers (NOT generative VoiceDesign)
# This guarantees the SAME voice identity for every generate_audio() call.
MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-8bit"

# TEMPERATURE: 0.3 → stable, low-variance prosody across all sections.
# Default (0.7) causes noticeable pitch/intonation drift. Do NOT raise above 0.4.
TEMPERATURE = 0.3

# Available Speakers in mlx-community/Qwen3-TTS-12Hz-1.7B-CustomVoice-8bit:
#   Male:   ryan, eric, dylan, aiden
#   Female: serena, vivian, ono_anna, sohee, uncle_fu
#
# Each preset maps to: (speaker_name, style_instruct)
# - speaker_name: passed as `voice=` to generate_audio, selects the timbre
# - style_instruct: controls speaking style/emotion (does NOT change speaker identity)

SPEAKER_PRESETS = {
    "happy_mentor_male": (
        "ryan",
        "Speaking in a friendly, encouraging, and optimistic tone, "
        "like a mentor guiding beginners in AI. Slightly upbeat pace, "
        "warm and approachable, smiling through the explanations.",
        1.15,  # Slightly faster — energetic mentor feel
    ),
    "ryan_professional": (
        "ryan",
        "Speaking in a calm, professional, and informative tone. "
        "Clear articulation, moderate pace, ideal for technical lectures.",
        1.0,
    ),
    "ryan_energetic": (
        "ryan",
        "Speaking with enthusiasm and energy, upbeat and engaging, "
        "like a passionate cloud architect sharing insights.",
        1.0,
    ),
    "eric_narrator": (
        "eric",
        "Speaking in a deep, professional narrator tone. "
        "Relaxed and confident delivery, slower deliberate pacing.",
        1.0,
    ),
    "dylan_enthusiast": (
        "dylan",
        "Energetic and clear, smiling tone, medium speed with rising "
        "intonation for engaging AI tutorials.",
        1.0,
    ),
    "aiden_calm": (
        "aiden",
        "Speaking in a calm, warm, and approachable tone. "
        "Steady pace, clear and confident, ideal for educational content.",
        1.0,
    ),
}

DEFAULT_VOICE = "aiden_calm"

OUTRO_CTA_TEXT = "Follow for daily cloud architecture breakdowns."

MAX_RETRIES = 2
OUTPUT_DIR = "voice_output"

# ── Helpers ────────────────────────────────────────────────────────────────────


def get_wav_duration(wav_path: str) -> float:
    """Get duration in seconds from a WAV file using the wave module."""
    try:
        with wave.open(wav_path, "r") as wf:
            frames = wf.getnframes()
            rate = wf.getframerate()
            if rate == 0:
                return 0.0
            return frames / float(rate)
    except Exception:
        pass

    # Fallback: try ffprobe
    try:
        result = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                wav_path,
            ],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return float(result.stdout.strip())
    except Exception as e:
        print(f"  ⚠️  Could not determine duration for {wav_path}: {e}")
        return 0.0


def generate_single_audio(
    model,
    text: str,
    speaker: str,
    instruct: str,
    output_prefix: str,
    speed: float = 1.0,
) -> str:
    """Generate a single WAV file with fixed speaker. Returns path to generated file."""
    from mlx_audio.tts.generate import generate_audio

    # Re-seed before each generation for maximum reproducibility
    mx.random.seed(42)

    generate_audio(
        model=model,
        text=text,
        voice=speaker,          # Fixed speaker name → locks timbre
        instruct=instruct,      # Style instruction (does not change speaker identity)
        lang_code="en",
        speed=speed,            # Per-preset speed control
        temperature=TEMPERATURE,  # Low temperature → stable prosody
        file_prefix=output_prefix,
    )

    # mlx_audio appends _000.wav to the prefix
    expected_path = f"{output_prefix}_000.wav"
    if not os.path.exists(expected_path):
        alt_path = f"{output_prefix}.wav"
        if os.path.exists(alt_path):
            return alt_path
        raise FileNotFoundError(
            f"Expected output at {expected_path} but file not found"
        )
    return expected_path


def generate_with_retry(
    model,
    text: str,
    speaker: str,
    instruct: str,
    output_prefix: str,
    speed: float = 1.0,
) -> str:
    """Generate audio with retry logic."""
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            path = generate_single_audio(model, text, speaker, instruct, output_prefix, speed)
            return path
        except Exception as e:
            last_error = e
            print(f"  ⚠️  Attempt {attempt}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES:
                print("  🔄 Retrying in 3 seconds...")
                time.sleep(3)

    raise RuntimeError(
        f"TTS generation failed after {MAX_RETRIES} attempts: {last_error}"
    )


# ── Main ───────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Generate per-section voiceover WAVs")
    parser.add_argument("--question", "-q", type=int, required=True, help="Question number")
    parser.add_argument("--content", "-c", type=str, required=True, help="Path to qN_content.json")
    parser.add_argument(
        "--voice", "-v",
        type=str,
        default=DEFAULT_VOICE,
        choices=list(SPEAKER_PRESETS.keys()),
        help=f"Speaker preset name (default: {DEFAULT_VOICE})",
    )
    parser.add_argument("--output-dir", type=str, default=OUTPUT_DIR, help="Output directory")
    args = parser.parse_args()

    # Validate content file
    if not os.path.exists(args.content):
        print(f"❌ Content file not found: {args.content}")
        sys.exit(1)

    with open(args.content, "r") as f:
        content = json.load(f)

    speaker_name, style_instruct, voice_speed = SPEAKER_PRESETS[args.voice]
    q_num = args.question
    out_dir = args.output_dir

    os.makedirs(out_dir, exist_ok=True)

    # ── Load model ─────────────────────────────────────────────────────────────
    print("\n🎙️  Voice Generation Pipeline (Consistent Speaker Mode)")
    print(f"   Model   : {MODEL_ID}")
    print(f"   Speaker : {speaker_name}  [{args.voice}]")
    print(f"   Speed   : {voice_speed}x")
    print(f"   Temp    : {TEMPERATURE}  (low = stable pitch)")
    print(f"   Seed    : 42 (fixed for reproducibility)")
    print(f"   Question: Q{q_num}")
    print(f"   Content : {args.content}")
    print(f"   Output  : {out_dir}/")
    print()

    print("📦 Loading TTS model...")
    try:
        from mlx_audio.tts.utils import load_model
        model = load_model(MODEL_ID)
    except Exception as e:
        print(f"❌ Failed to load model: {e}")
        sys.exit(1)
    print("✅ Model loaded.\n")

    segments = []
    total_start = time.time()

    # ── 1. Intro (hook text) ───────────────────────────────────────────────────
    intro_text = content.get("hook_text") or content.get("question_text", "")
    if intro_text:
        print("🎬 Generating intro voice...")
        print(f"   Text: {intro_text[:80]}...")
        prefix = os.path.join(out_dir, f"q{q_num}_intro")
        wav_path = generate_with_retry(model, intro_text, speaker_name, style_instruct, prefix, voice_speed)
        duration = get_wav_duration(wav_path)
        segments.append({
            "key": "intro",
            "path": wav_path,
            "duration_seconds": round(duration, 2),
        })
        print(f"   ✅ {wav_path} ({duration:.1f}s)\n")

    # ── 2. Per-section audio ───────────────────────────────────────────────────
    sections = content.get("answer_sections", [])
    for i, section in enumerate(sections):
        section_id = section.get("id", f"s{i + 1}")
        spoken_text = section.get("spoken_audio") or section.get("text", "")

        if not spoken_text.strip():
            print(f"⏭️  Skipping section {section_id} (empty text)")
            continue

        # Clean up any markdown artifacts
        clean_text = spoken_text.replace("**", "").replace("*", "").strip()

        print(f"🔊 Generating section {section_id} ({i + 1}/{len(sections)})...")
        print(f"   Text: {clean_text[:80]}...")

        prefix = os.path.join(out_dir, f"q{q_num}_{section_id}")
        wav_path = generate_with_retry(model, clean_text, speaker_name, style_instruct, prefix, voice_speed)
        duration = get_wav_duration(wav_path)

        segments.append({
            "key": section_id,
            "path": wav_path,
            "duration_seconds": round(duration, 2),
        })
        print(f"   ✅ {wav_path} ({duration:.1f}s)\n")

    # ── 3. Outro CTA ──────────────────────────────────────────────────────────
    print("📢 Generating outro CTA...")
    prefix = os.path.join(out_dir, f"q{q_num}_outro")
    wav_path = generate_with_retry(model, OUTRO_CTA_TEXT, speaker_name, style_instruct, prefix, voice_speed)
    duration = get_wav_duration(wav_path)
    segments.append({
        "key": "outro",
        "path": wav_path,
        "duration_seconds": round(duration, 2),
    })
    print(f"   ✅ {wav_path} ({duration:.1f}s)\n")

    # ── 4. Write manifest ──────────────────────────────────────────────────────
    manifest = {
        "question": q_num,
        "voice": args.voice,
        "speaker": speaker_name,
        "speed": voice_speed,
        "model": MODEL_ID,
        "temperature": TEMPERATURE,
        "seed": 42,
        "segments": segments,
        "total_duration_seconds": round(sum(s["duration_seconds"] for s in segments), 2),
    }

    manifest_path = os.path.join(out_dir, f"q{q_num}_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    elapsed = time.time() - total_start

    print("═" * 50)
    print("🎉 Voice generation complete!")
    print(f"   Speaker  : {speaker_name} @ {voice_speed}x (consistent across all segments)")
    print(f"   Segments : {len(segments)}")
    print(f"   Total    : {manifest['total_duration_seconds']:.1f}s of audio")
    print(f"   Elapsed  : {elapsed:.1f}s")
    print(f"   Manifest : {manifest_path}")
    print("═" * 50)


if __name__ == "__main__":
    main()
