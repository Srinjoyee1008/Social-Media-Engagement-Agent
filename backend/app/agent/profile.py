import json
import os
import re

from dotenv import load_dotenv
from google import genai

from app.agent.memory import remember, recall

load_dotenv()

client = genai.Client(
    api_key=os.getenv("LLM_API_KEY")
)

MODELS = [
    "gemini-3.6-flash",
    "gemini-3.6-flash-lite",
]


def extract_json(text: str):
    """
    Extract JSON even if Gemini wraps it in markdown.
    """

    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"```json|```", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)

        if match:
            return json.loads(match.group())

        raise ValueError("Gemini did not return valid JSON.")


def analyze_profile(profile_url: str, profile_text: str):

    prompt = f"""
You are a professional profile analysis assistant.

Analyze the following public professional profile information.

Profile URL:
{profile_url}

Profile content:
{profile_text}

Extract useful information for a social media content agent.

Return ONLY valid JSON in this exact structure:

{{
    "name": "",
    "headline": "",
    "about": "",
    "skills": [],
    "experience": [],
    "education": [],
    "interests": [],
    "content_topics": [],
    "writing_style": [],
    "target_audience": []
}}

Rules:
- Do not invent information.
- Use empty arrays when information is unavailable.
- Keep the extracted information concise.
- Identify technical topics the person is likely to post about.
- Infer writing style only from the supplied content.
"""

    response = None

    for model in MODELS:
        try:
            print(f"Trying profile analysis model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response and response.text:
                break

        except Exception as e:
            print(f"Profile model failed: {e}")

    if response is None or not response.text:
        raise RuntimeError(
            "Profile analysis failed. Please try again."
        )

    profile = extract_json(response.text)

    # Store the complete profile as persistent Hindsight memory.
    memory = f"""
SOCIAL MEMORY AGENT USER PROFILE

Profile URL:
{profile_url}

Name:
{profile.get("name", "")}

Headline:
{profile.get("headline", "")}

About:
{profile.get("about", "")}

Skills:
{", ".join(profile.get("skills", []))}

Experience:
{json.dumps(profile.get("experience", []))}

Education:
{json.dumps(profile.get("education", []))}

Interests:
{", ".join(profile.get("interests", []))}

Content Topics:
{", ".join(profile.get("content_topics", []))}

Writing Style:
{", ".join(profile.get("writing_style", []))}

Target Audience:
{", ".join(profile.get("target_audience", []))}
"""

    remember(memory)

    # Store important individual preferences separately.
    if profile.get("writing_style"):
        remember(
            "User writing style preferences: "
            + ", ".join(profile["writing_style"])
        )

    if profile.get("content_topics"):
        remember(
            "User's preferred content topics: "
            + ", ".join(profile["content_topics"])
        )

    if profile.get("target_audience"):
        remember(
            "User's target audience: "
            + ", ".join(profile["target_audience"])
        )

    return profile


def get_profile():

    memories = recall(
        """
        Find the user's professional profile.

        Look for:
        - name
        - headline
        - about
        - skills
        - experience
        - education
        - interests
        - content topics
        - writing style
        - target audience
        """
    )

    if not memories:
        return None

    profile_memories = "\n".join(
        memory.text for memory in memories
    )

    prompt = f"""
Reconstruct the user's professional profile from these memories.

MEMORIES:
{profile_memories}

Return ONLY valid JSON:

{{
    "name": "",
    "headline": "",
    "about": "",
    "skills": [],
    "experience": [],
    "education": [],
    "interests": [],
    "content_topics": [],
    "writing_style": [],
    "target_audience": []
}}

Do not invent information.
"""

    response = client.models.generate_content(
        model=MODELS[0],
        contents=prompt
    )

    if not response or not response.text:
        return None

    try:
        return extract_json(response.text)
    except Exception:
        return None