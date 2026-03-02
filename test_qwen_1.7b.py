# from mlx_audio.tts.utils import load_model
# from mlx_audio.tts.generate import generate_audio

# model_id = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit"
# model = load_model(model_id)

# edu_text = (
#     "In this lesson, we will explore a modern Generative AI architecture. "
#     "We start from the user request, move through the orchestration layer, "
#     "then connect to tools, vector databases, and specialized models. "
#     "Notice how each component collaborates to deliver intelligent behavior."
# )

# voice_presets = {
#     "calm_teacher": "A warm Indian English male voice, calm and patient, medium pace, clear articulation, gentle enthusiasm, ideal for technical lectures.",
#     "happy_mentor": "A friendly Indian English female voice, smiling, slightly fast pace, encouraging and optimistic, like a mentor guiding beginners in AI.",
#     "deep_podcast": "A deep Indian English male voice, relaxed and confident, podcast-style narration, subtle excitement on key technical terms.",
# }

# for name, instruct in voice_presets.items():
#     out_prefix = f"mlx_genai_{name}"

#     generate_audio(
#         model=model,
#         text=edu_text,
#         instruct=instruct,   # ← REQUIRED for VoiceDesign models
#         language="en",
#         speed=1.0,
#         file_prefix=out_prefix,
#     )

#     print("Saved:", out_prefix + "_0.wav")


from mlx_audio.tts.utils import load_model
from mlx_audio.tts.generate import generate_audio

model_id = "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit"
model = load_model(model_id)

rag_eval_text = (
    "Evaluating a RAG system ensures accurate retrieval and grounded generation. "
    "Key metrics include faithfulness to check hallucinations, answer relevancy for query alignment, "
    "and context precision or recall to verify retrieved chunks. "
    "Use frameworks like Ragas or Galileo AI for LLM-as-judge scoring on golden datasets. "
    "Test retrieval separately from generation, monitor for completeness, and iterate with A/B comparisons. "
    "This prevents silent failures in production pipelines."
)

voice_presets = {
    # "calm_teacher": "A warm Indian English male voice, calm and patient, medium pace, clear articulation, gentle enthusiasm, ideal for technical lectures.",
    # "happy_mentor": "A friendly Indian English female voice, smiling, slightly fast pace, encouraging and optimistic, like a mentor guiding beginners in AI.",
    # "deep_podcast": "A deep Indian English male voice, relaxed and confident, podcast-style narration, subtle excitement on key technical terms.",
    # "warm_teacher": "A warm Indian English male teacher voice, medium pace, clear and patient, with gentle enthusiasm and natural pauses for technical explanations.",
    # "female_mentor": "Friendly Indian English female mentor voice, slightly upbeat tone, encouraging and optimistic, articulate with emphasis on key concepts like orchestration and vector databases.",
    # "deep_narrator": "Professional deep male narrator in neutral Indian English, relaxed confident delivery, subtle excitement on complex topics, slow deliberate pacing for learner comprehension.",
    # "tech_enthusiast": "Young tech enthusiast female voice with Indian English accent, energetic yet clear, smiling tone, medium speed with rising intonation for engaging AI tutorials.",
    # "authoritative_edu": "Calm authoritative male educator voice, Indian English, steady rhythm, warm reassurance, precise articulation ideal for breaking down architecture layers.",
    # "happy_mentor_male": "A friendly Indian English male voice, smiling, slightly fast pace, encouraging and optimistic, like a mentor guiding beginners in AI.",
    # "happy_deep": "A deep resonant Indian English male voice, happy and enthusiastic, warm energy, medium pace with natural emphasis for technical explanations.",
    # "happy_authoritative": "An authoritative Indian English male voice, happy and confident, uplifting tone, clear commanding delivery with motivational flair.",
    # "happy_deep_authoritative": "A deep authoritative Indian English male voice, infused with happy enthusiasm, resonant and motivational, steady pace for inspiring AI tutorials.",
    # "happy_deep_authoritative_mentor": "A deep authoritative Indian English male mentor voice, happy and motivational, resonant timbre with warm enthusiasm, confident medium pace, guiding tone for technical education." 
    "tech_enthusiast": "Young tech enthusiast male voice with Indian English accent, energetic yet clear, smiling tone, medium speed with rising intonation for engaging AI tutorials.",

}

for name, instruct in voice_presets.items():
    out_prefix = f"rag_eval_{name}"
    generate_audio(
        model=model,
        text=rag_eval_text,
        instruct=instruct,
        language="en",
        speed=1.0,
        file_prefix=out_prefix,
    )
    print("Saved:", out_prefix + "_0.wav")
