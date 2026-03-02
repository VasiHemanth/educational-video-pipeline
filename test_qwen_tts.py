import json
import sys
import os

try:
    from mlx_audio.tts.utils import load_model
    from mlx_audio.tts.generate import generate_audio
except ImportError as e:
    print(f"Error importing mlx_audio: {e}")
    sys.exit(1)

model_id = "mlx-community/Qwen3-TTS-12Hz-0.6B-Base-4bit"

def main():
    print(f"Loading model: {model_id}...")
    try:
        model = load_model(model_id)
    except Exception as e:
        print(f"Failed to load model: {e}")
        sys.exit(1)

    print("Model loaded successfully.")

    # Read the text to synthesize
    try:
        with open("output_prod/q9_content.json", "r") as f:
            data = json.load(f)
        text_to_synthesize = data["answer_sections"][0]["spoken_audio"]
    except Exception as e:
        print(f"Could not read q9_content.json, using fallback text. Error: {e}")
        text_to_synthesize = "Welcome to our GCP cloud architecture series. Today, we are exploring model governance on Google Cloud."

    print(f"\nText to synthesize:\n{text_to_synthesize}\n")

    print("Generating audio...")
    try:
        os.makedirs("voice_output", exist_ok=True)
        generate_audio(
            model=model,
            text=text_to_synthesize,
            file_prefix="voice_output/test_qwen_audio"
        )
        print("✅ Generation complete! Saved to voice_output/test_qwen_audio.wav")
    except Exception as e:
        print(f"❌ Generation failed: {e}")

if __name__ == "__main__":
    main()
