#!/usr/bin/env python3
"""
Voice Generation Script — Qwen3 TTS 1.7B VoiceDesign
═════════════════════════════════════════════════════
Generates per-section WAV files from a pipeline content JSON.
Outputs a voice_manifest.json with paths + durations.

Usage:
    python scripts/generate_voice.py --question 11 --content output_prod/q11_content.json
    python scripts/generate_voice.py --question 11 --content output_prod/q11_content.json --voice calm_teacher

Requires:
    - mlx_audio (pip install mlx-audio)
    - ffprobe (from ffmpeg, for duration detection)
"""

import argparse
import json
import os
import subprocess
import sys
import time
import wave

# ── Configuration ──────────────────────────────────────────────────────────────

MODEL_ID = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit"

VOICE_PRESETS = {
    "happy_mentor_male": (
        "A friendly Indian English male voice, smiling, slightly fast pace, "
        "encouraging and optimistic, like a mentor guiding beginners in AI."
    ),
    "calm_teacher": (
        "A warm Indian English male voice, calm and patient, medium pace, "
        "clear articulation, gentle enthusiasm, ideal for technical lectures."
    ),
    "deep_narrator": (
        "Professional deep male narrator in neutral Indian English, relaxed "
        "confident delivery, subtle excitement on complex topics, slow "
        "deliberate pacing for learner comprehension."
    ),
    "tech_enthusiast": (
        "Young tech enthusiast male voice with Indian English accent, "
        "energetic yet clear, smiling tone, medium speed with rising "
        "intonation for engaging AI tutorials."
    ),
}

DEFAULT_VOICE = "happy_mentor_male"

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


def generate_single_audio(model, text: str, instruct: str, output_prefix: str) -> str:
    """Generate a single WAV file. Returns the path to the generated file."""
    from mlx_audio.tts.generate import generate_audio

    generate_audio(
        model=model,
        text=text,
        instruct=instruct,
        language="en",
        speed=1.0,
        file_prefix=output_prefix,
    )

    # mlx_audio appends _000.wav to the prefix
    expected_path = f"{output_prefix}_000.wav"
    if not os.path.exists(expected_path):
        # Try without suffix
        alt_path = f"{output_prefix}.wav"
        if os.path.exists(alt_path):
            return alt_path
        raise FileNotFoundError(
            f"Expected output at {expected_path} but file not found"
        )
    return expected_path


def generate_with_retry(model, text: str, instruct: str, output_prefix: str) -> str:
    """Generate audio with retry logic."""
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            path = generate_single_audio(model, text, instruct, output_prefix)
            return path
        except Exception as e:
            last_error = e
            print(f"  ⚠️  Attempt {attempt}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES:
                print(f"  🔄 Retrying in 3 seconds...")
                time.sleep(3)

    # All retries exhausted
    raise RuntimeError(
        f"TTS generation failed after {MAX_RETRIES} attempts: {last_error}"
    )


# ── Main ───────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="Generate per-section voiceover WAVs")
    parser.add_argument("--question", "-q", type=int, required=True, help="Question number")
    parser.add_argument("--content", "-c", type=str, required=True, help="Path to qN_content.json")
    parser.add_argument("--voice", "-v", type=str, default=DEFAULT_VOICE,
                        choices=list(VOICE_PRESETS.keys()), help="Voice preset name")
    parser.add_argument("--output-dir", type=str, default=OUTPUT_DIR, help="Output directory")
    args = parser.parse_args()

    # Validate content file
    if not os.path.exists(args.content):
        print(f"❌ Content file not found: {args.content}")
        sys.exit(1)

    with open(args.content, "r") as f:
        content = json.load(f)

    voice_instruct = VOICE_PRESETS[args.voice]
    q_num = args.question
    out_dir = args.output_dir

    os.makedirs(out_dir, exist_ok=True)

    # ── Load model ─────────────────────────────────────────────────────────────
    print(f"\n🎙️  Voice Generation Pipeline")
    print(f"   Model   : {MODEL_ID}")
    print(f"   Voice   : {args.voice}")
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
        print(f"🎬 Generating intro voice...")
        print(f"   Text: {intro_text[:80]}...")
        prefix = os.path.join(out_dir, f"q{q_num}_intro")
        wav_path = generate_with_retry(model, intro_text, voice_instruct, prefix)
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
        wav_path = generate_with_retry(model, clean_text, voice_instruct, prefix)
        duration = get_wav_duration(wav_path)

        segments.append({
            "key": section_id,
            "path": wav_path,
            "duration_seconds": round(duration, 2),
        })
        print(f"   ✅ {wav_path} ({duration:.1f}s)\n")

    # ── 3. Outro CTA ──────────────────────────────────────────────────────────
    print(f"📢 Generating outro CTA...")
    prefix = os.path.join(out_dir, f"q{q_num}_outro")
    wav_path = generate_with_retry(model, OUTRO_CTA_TEXT, voice_instruct, prefix)
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
        "model": MODEL_ID,
        "segments": segments,
        "total_duration_seconds": round(sum(s["duration_seconds"] for s in segments), 2),
    }

    manifest_path = os.path.join(out_dir, f"q{q_num}_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    elapsed = time.time() - total_start

    print("═" * 50)
    print(f"🎉 Voice generation complete!")
    print(f"   Segments : {len(segments)}")
    print(f"   Total    : {manifest['total_duration_seconds']:.1f}s of audio")
    print(f"   Elapsed  : {elapsed:.1f}s")
    print(f"   Manifest : {manifest_path}")
    print("═" * 50)


if __name__ == "__main__":
    main()
