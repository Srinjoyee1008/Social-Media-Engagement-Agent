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

SUPPORTED_SOURCES = {
    "LinkedIn",
    "Naukri",
    "Indeed",
    "GitHub",
    "Portfolio",
}


def extract_json(text: str):
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


def analyze_profile(
    profile_url: str,
    profile_text: str,
    source: str = "LinkedIn"
):
    """
    Analyze a professional profile from a supported source.

    The URL is treated as a source/reference.
    The supplied profile_text is the actual information analyzed.
    """

    if source not in SUPPORTED_SOURCES:
        source = "Portfolio"

    prompt = f"""
You are a professional profile analysis assistant
for a Social Media Engagement Agent.

The user has provided information from a professional
profile or professional website.

Profile source:
{source}

Profile URL:
{profile_url}

Profile information:
{profile_text}

Analyze ONLY the information provided above.

Return ONLY valid JSON using this exact structure:

{{
    "name": "",
    "headline": "",
    "about": "",
    "skills": [],
    "experience": [],
    "education": [],
    "interests": [],
    "projects": [],
    "content_topics": [],
    "writing_style": [],
    "target_audience": []
}}

Rules:
- Do not invent information.
- Use empty strings or arrays when information is unavailable.
- Keep extracted information concise.
- Extract technical skills when explicitly mentioned.
- Extract projects when explicitly mentioned.
- Identify useful professional content topics.
- Infer writing style only when enough text is available.
- Do not claim that the profile was scraped.
- Do not invent employment, education, skills, or achievements.
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
                print(f"Profile analyzed using: {model}")
                break

        except Exception as e:
            print(f"Profile model failed: {e}")

    if response is None or not response.text:
        raise RuntimeError(
            "Profile analysis failed. Please try again."
        )

    profile = extract_json(response.text)

    # ---------------------------------------------------------
    # Store complete professional identity in Hindsight
    # ---------------------------------------------------------

    memory = f"""
SOCIAL MEMORY AGENT PROFESSIONAL PROFILE

Profile Source:
{source}

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

Projects:
{json.dumps(profile.get("projects", []))}

Content Topics:
{", ".join(profile.get("content_topics", []))}

Writing Style:
{", ".join(profile.get("writing_style", []))}

Target Audience:
{", ".join(profile.get("target_audience", []))}
"""

    remember(memory)

    # Store important information as separate memories.
    if profile.get("skills"):
        remember(
            "User professional skills: "
            + ", ".join(profile["skills"])
        )

    if profile.get("projects"):
        remember(
            "User professional projects: "
            + ", ".join(
                str(project)
                for project in profile["projects"]
            )
        )

    if profile.get("writing_style"):
        remember(
            "User writing style preferences: "
            + ", ".join(profile["writing_style"])
        )

    if profile.get("content_topics"):
        remember(
            "User preferred professional content topics: "
            + ", ".join(profile["content_topics"])
        )

    if profile.get("target_audience"):
        remember(
            "User target audience: "
            + ", ".join(profile["target_audience"])
        )

    # Remember the source as well.
    remember(
        f"Professional profile source: {source}. "
        f"Profile URL: {profile_url}"
    )

    return profile


def get_profile():
    """
    Reconstruct the user's professional profile
    from persistent Hindsight memory.
    """

    memories = recall(
        """
        Find the user's professional profile.

        Look for:
        - profile source
        - profile URL
        - name
        - headline
        - about
        - skills
        - experience
        - education
        - interests
        - projects
        - content topics
        - writing style
        - target audience
        """
    )

    if not memories:
        return None

    profile_memories = "\n".join(
        memory.text
        for memory in memories
    )

    prompt = f"""
Reconstruct the user's professional profile
from these Hindsight memories.

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
    "projects": [],
    "content_topics": [],
    "writing_style": [],
    "target_audience": []
}}

Rules:
- Use only information present in the memories.
- Do not invent information.
- Combine duplicate information where appropriate.
"""

    response = None

    for model in MODELS:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response and response.text:
                break

        except Exception as e:
            print(f"Profile reconstruction failed: {e}")

    if response is None or not response.text:
        return None

    try:
        return extract_json(response.text)
    except Exception:
        return None