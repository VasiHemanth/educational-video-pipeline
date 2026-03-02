# Voice Generation Pipeline

This module introduces an experimental TTS generation using **Qwen3-TTS** via Apple's MLX framework for the educational video pipeline. 

## What's Implemented?
- **Text-To-Speech Script (`test_qwen_tts.py`)**: Uses `mlx-audio` running locally on Apple Silicon to synthesize audio locally without relying on external API calls.
- **Dynamic Content Input**: The script reads the spoken audio sentences directly from the generated content JSON outputs (e.g., `q9_content.json`).
- **Dedicated Output Directory**: All synthesized audio is saved automatically to the `/voice_output` directory to keep the root directory clean. 

## Requirements
To run voice synthesis, please install the dependencies:
```bash
pip install -r requirements.txt
```
*Note: Make sure you are on a compatible env for `mlx_audio`.*

## Usage
Simply run the script. Ensure you have run the main video pipeline (`pipeline.js`) first so that a `content.json` file is available inside the `output_prod` directory.

```bash
python test_qwen_tts.py
```

The audio file will be placed into the `voice_output` directory.
