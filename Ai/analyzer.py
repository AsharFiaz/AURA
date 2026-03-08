from google import genai
from google.genai import types
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GENAI_API_KEY environment variable not set")

client = genai.Client(api_key=api_key)

# CORE HEADER (always included)
CORE_PROMPT = """
You are an expert personality inference engine for the Big Five (OCEAN) model.

Traits:
- Openness: curiosity, creativity, abstraction, novelty
- Conscientiousness: discipline, planning, goal-orientation
- Extraversion: social engagement, energy, assertiveness
- Agreeableness: empathy, cooperation, prosociality
- Neuroticism: emotional volatility, stress sensitivity

Scoring rules:
- Each trait: float [0.0, 1.0]
- Deterministic across identical inputs
- Treat traits as probabilistic indicators
- Distinguish preferences vs temporary states
- Apply cultural/contextual awareness
- Output STRICT JSON with keys:
    1. "ocean_scores_per_modality"
    2. "reasoning_per_modality"
    3. "ocean_scores_integrated"
    4. "reasoning_integrated"

Instructions:
1. You may receive text, and/or image, and/or video together.
2. Return **one OCEAN vector per modality** in "ocean_scores_per_modality".
3. Include reasoning per modality in "reasoning_per_modality", referencing observable cues and cultural context.
4. Generate **one integrated OCEAN vector** in "ocean_scores_integrated" that **analyzes the relationship between modalities**:
    - Detect contradictions (e.g., text playful but video angry) 
    - Detect humor, sarcasm, memes, exaggeration
    - Adjust scores if one modality indicates a **temporary or non-literal emotional state**
    - Explain adjustments clearly in "reasoning_integrated"
5. Use per-modality vectors as **ground-truth signals**, but let the integrated vector reflect **true personality considering context**.
6. If a modality is not provided, omit it.
7. Avoid mentioning internal model mechanics, APIs, or training data.
"""
# TEXT GUIDELINES
TEXT_PROMPT = """
Text-based inference:
- Analyze semantics, emotion, style, syntax, social references, and preferences
- Include cultural context for idioms, politeness, or norms
- Use repeated texts to strengthen inference
"""

# IMAGE GUIDELINES
IMAGE_PROMPT = """
Image-based inference:
- Identify categories: human faces, animals, objects, nature, text/quotes, scenes, art, symbols
- Human faces: analyze expression, posture, engagement
- No faces: infer from aesthetics, objects, scene context, OCR text if present
- Consider scene calmness, artistic style, and object categories
- Use cultural context to adjust interpretation
- Treat signals as probabilistic indicators of preferences/values
"""

# VIDEO GUIDELINES
VIDEO_PROMPT = """
Video-based inference:
- Classify video: human-centered, social, nature, animal, cultural, informational, artistic
- Treat video as temporal multimodal signal: visuals, audio, language, behavior
- Humans present: analyze face, body, gestures, interaction
- Voice/speech: analyze tone, confidence, emotion; transcribe text for analysis
- Humans absent: infer personality from interests, aesthetics
- Apply cultural/religious context, avoid momentary states
- Use repeated patterns over time
"""

# REASONING INSTRUCTION
REASONING_PROMPT = """
Explain reasoning clearly:
- Reference observable cues per modality (language, behavior, aesthetics, voice)
- Avoid mentioning internal model mechanics or training data
"""


def build_prompt(
    user_text: str | None = None,
    image_bytes: bytes | None = None,
    video_bytes: bytes | None = None
) -> str:
    
    prompt_parts = [CORE_PROMPT]
    
    if user_text:
        prompt_parts.append(TEXT_PROMPT)
    if image_bytes:
        prompt_parts.append(IMAGE_PROMPT)
    if video_bytes:
        prompt_parts.append(VIDEO_PROMPT)
    
    prompt_parts.append(REASONING_PROMPT)
    
    return "\n".join(prompt_parts)


def analyze_personality(
    user_text: str | None = None,
    image_bytes: bytes | None = None,
    video_bytes: bytes | None = None,
) -> str:

    parts: list[types.Part] = []

    SYSTEM_PROMPT = build_prompt(user_text,image_bytes ,video_bytes)

    parts.append(types.Part(text=SYSTEM_PROMPT))

    if user_text:
        parts.append(types.Part(text=user_text))

    if image_bytes:
        parts.append(
            types.Part(
                inline_data=types.Blob(
                    mime_type="image/jpeg",
                    data=image_bytes
                )
            )
        )

    if video_bytes:
        parts.append(
            types.Part(
                inline_data=types.Blob(
                    mime_type="video/mp4",
                    data=video_bytes
                )
            )
        )


    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=parts,
    )

    return response.text