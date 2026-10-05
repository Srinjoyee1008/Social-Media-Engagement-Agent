
import json
import os
import re

from dotenv import load_dotenv
from google import genai

from app.agent.memory import remember, recall


# ============================================================
# CONFIGURATION
# ============================================================

load_dotenv()

client = genai.Client(
    api_key=os.getenv("LLM_API_KEY")
)


# Use the Gemma models that are available in your project.
# The previous Gemini models were either unavailable or
# returned 404/503 errors in your current API configuration.

MODELS = [
    "gemma-4-26b-a4b-it",
    "gemma-4-31b-it",
]


SUPPORTED_SOURCES = {
    "LinkedIn",
    "Naukri",
    "Indeed",
    "GitHub",
    "Portfolio",
}


# ============================================================
# JSON EXTRACTION
# ============================================================

def extract_json(text: str) -> dict:
    """
    Extract a JSON object from the model response.

    Handles:
    - normal JSON
    - ```json ... ```
    - ``` ... ```
    - JSON surrounded by additional text
    """

    if not text:
        raise ValueError(
            "Model returned an empty response."
        )

    text = text.strip()

    # --------------------------------------------------------
    # Remove Markdown code fences
    # --------------------------------------------------------

    text = re.sub(
        r"^```json\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"^```\s*",
        "",
        text
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # --------------------------------------------------------
    # First attempt: entire response is JSON
    # --------------------------------------------------------

    try:

        result = json.loads(text)

        if isinstance(result, dict):
            return result

    except json.JSONDecodeError:
        pass

    # --------------------------------------------------------
    # Second attempt: find JSON object inside response
    # --------------------------------------------------------

    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:

        json_text = text[start:end + 1]

        try:

            result = json.loads(json_text)

            if isinstance(result, dict):
                return result

        except json.JSONDecodeError as exc:

            raise ValueError(
                f"Model returned invalid JSON: {exc}"
            ) from exc

    raise ValueError(
        "Model did not return a valid JSON object."
    )


# ============================================================
# PROFILE NORMALIZATION
# ============================================================

def normalize_profile(profile: dict) -> dict:
    """
    Make sure the profile always has the expected structure.
    """

    fields = {
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
        "target_audience": [],
    }

    normalized = {}

    for field, default in fields.items():

        value = profile.get(
            field,
            default
        )

        # ----------------------------------------------------
        # String fields
        # ----------------------------------------------------

        if field in {
            "name",
            "headline",
            "about"
        }:

            if isinstance(value, str):

                normalized[field] = value.strip()

            else:

                normalized[field] = ""

        # ----------------------------------------------------
        # List fields
        # ----------------------------------------------------

        else:

            if isinstance(value, list):

                normalized[field] = value

            elif value:

                normalized[field] = [
                    str(value)
                ]

            else:

                normalized[field] = []

    return normalized


# ============================================================
# PROFILE ANALYSIS PROMPT
# ============================================================

def build_profile_prompt(
    profile_url: str,
    profile_text: str,
    source: str
) -> str:

    return f"""
You are a professional profile analysis assistant
for a Social Media Engagement Agent.

The user has provided information from a professional
profile or professional website.

PROFILE SOURCE:
{source}

PROFILE URL:
{profile_url}

PROFILE INFORMATION:
{profile_text}

Analyze ONLY the information provided above.

Return ONLY valid JSON using exactly this structure:

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

1. Do not invent information.
2. Use empty strings or arrays when information is unavailable.
3. Keep extracted information concise.
4. Extract technical skills only when explicitly mentioned.
5. Extract projects only when explicitly mentioned.
6. Extract education only when explicitly mentioned.
7. Extract experience only when explicitly mentioned.
8. Identify useful professional content topics from the supplied information.
9. Infer writing style only when enough text is available.
10. Do not claim that the profile was scraped.
11. Do not invent employment, education, skills, achievements, or experience.
12. Return JSON only.
"""


# ============================================================
# ANALYZE PROFILE
# ============================================================

async def analyze_profile(
    profile_url: str,
    profile_text: str,
    source: str = "LinkedIn"
):
    """
    Analyze a professional profile.

    Flow:

    Profile information
            ↓
        Gemma 4
            ↓
    Structured profile
            ↓
        Hindsight
            ↓
    Persistent memories
    """

    # --------------------------------------------------------
    # Validate source
    # --------------------------------------------------------

    if source not in SUPPORTED_SOURCES:

        source = "Portfolio"

    # --------------------------------------------------------
    # Validate profile information
    # --------------------------------------------------------

    if not profile_text or not profile_text.strip():

        raise ValueError(
            "Profile information cannot be empty."
        )

    profile_url = (
        profile_url or ""
    ).strip()

    profile_text = profile_text.strip()

    # --------------------------------------------------------
    # Build prompt
    # --------------------------------------------------------

    prompt = build_profile_prompt(
        profile_url=profile_url,
        profile_text=profile_text,
        source=source
    )

    # --------------------------------------------------------
    # Generate profile
    # --------------------------------------------------------

    response = None
    successful_model = None
    last_error = None

    for model in MODELS:

        try:

            print(
                f"Trying profile analysis model: {model}"
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response and response.text:

                successful_model = model

                print(
                    f"Profile analyzed using: {model}"
                )

                break

            print(
                f"Model {model} returned an empty response."
            )

        except Exception as exc:

            last_error = exc

            print(
                f"Profile model failed: {exc}"
            )

    # --------------------------------------------------------
    # Check generation
    # --------------------------------------------------------

    if response is None or not response.text:

        raise RuntimeError(
            "Profile analysis failed. "
            f"Last model error: {last_error}"
        )

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        profile = extract_json(
            response.text
        )

        profile = normalize_profile(
            profile
        )

    except Exception as exc:

        print(
            f"Profile JSON parsing failed: {exc}"
        )

        print(
            "Raw model response:"
        )

        print(response.text)

        raise RuntimeError(
            "Gemma returned an invalid profile format."
        ) from exc

    # --------------------------------------------------------
    # Store model information
    # --------------------------------------------------------

    profile["_model_used"] = successful_model

    # ========================================================
    # BUILD PROFESSIONAL MEMORY
    # ========================================================

    memory = f"""
SOCIAL MEMORY AGENT - PROFESSIONAL PROFILE

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
{", ".join(map(str, profile.get("skills", [])))}

Experience:
{json.dumps(
    profile.get("experience", []),
    ensure_ascii=False
)}

Education:
{json.dumps(
    profile.get("education", []),
    ensure_ascii=False
)}

Interests:
{", ".join(
    map(str, profile.get("interests", []))
)}

Projects:
{json.dumps(
    profile.get("projects", []),
    ensure_ascii=False
)}

Content Topics:
{", ".join(
    map(str, profile.get("content_topics", []))
)}

Writing Style:
{", ".join(
    map(str, profile.get("writing_style", []))
)}

Target Audience:
{", ".join(
    map(str, profile.get("target_audience", []))
)}
"""

    # ========================================================
    # STORE COMPLETE PROFILE
    # ========================================================

    try:

        await remember(memory)

        print(
            "Complete professional profile stored in Hindsight."
        )

    except Exception as exc:

        print(
            f"Hindsight profile storage failed: {exc}"
        )

    # ========================================================
    # STORE INDIVIDUAL MEMORIES
    # ========================================================

    memory_items = []

    if profile.get("skills"):

        memory_items.append(
            "User professional skills: "
            + ", ".join(
                map(
                    str,
                    profile["skills"]
                )
            )
        )

    if profile.get("projects"):

        memory_items.append(
            "User professional projects: "
            + ", ".join(
                map(
                    str,
                    profile["projects"]
                )
            )
        )

    if profile.get("writing_style"):

        memory_items.append(
            "User writing style preferences: "
            + ", ".join(
                map(
                    str,
                    profile["writing_style"]
                )
            )
        )

    if profile.get("content_topics"):

        memory_items.append(
            "User preferred professional content topics: "
            + ", ".join(
                map(
                    str,
                    profile["content_topics"]
                )
            )
        )

    if profile.get("target_audience"):

        memory_items.append(
            "User target audience: "
            + ", ".join(
                map(
                    str,
                    profile["target_audience"]
                )
            )
        )

    if profile.get("interests"):

        memory_items.append(
            "User professional interests: "
            + ", ".join(
                map(
                    str,
                    profile["interests"]
                )
            )
        )

    if profile.get("education"):

        memory_items.append(
            "User education: "
            + ", ".join(
                map(
                    str,
                    profile["education"]
                )
            )
        )

    # --------------------------------------------------------
    # Save individual memories
    # --------------------------------------------------------

    for item in memory_items:

        try:

            await remember(item)

        except Exception as exc:

            print(
                f"Individual memory storage failed: {exc}"
            )

    # ========================================================
    # STORE PROFILE SOURCE
    # ========================================================

    try:

        await remember(
            f"Professional profile source: {source}. "
            f"Profile URL: {profile_url}"
        )

    except Exception as exc:

        print(
            f"Profile source memory failed: {exc}"
        )

    # ========================================================
    # RETURN PROFILE
    # ========================================================

    return profile


# ============================================================
# RECONSTRUCT PROFILE FROM HINDSIGHT
# ============================================================

async def get_profile():
    """
    Reconstruct the user's professional profile
    from persistent Hindsight memory.
    """

    # --------------------------------------------------------
    # Recall profile memories
    # --------------------------------------------------------

    try:

        memories = await recall(
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

    except Exception as exc:

        print(
            f"Profile memory recall failed: {exc}"
        )

        return None

    # --------------------------------------------------------
    # No memories
    # --------------------------------------------------------

    if not memories:

        return None

    # --------------------------------------------------------
    # Convert Hindsight memories to text
    # --------------------------------------------------------

    memory_texts = []

    for memory in memories:

        if hasattr(memory, "text"):

            memory_texts.append(
                memory.text
            )

        elif isinstance(memory, str):

            memory_texts.append(
                memory
            )

        else:

            memory_texts.append(
                str(memory)
            )

    profile_memories = "\n".join(
        memory_texts
    )

    # --------------------------------------------------------
    # Reconstruction prompt
    # --------------------------------------------------------

    prompt = f"""
Reconstruct the user's professional profile
from these Hindsight memories.

MEMORIES:

{profile_memories}

Return ONLY valid JSON using exactly this structure:

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

1. Use only information present in the memories.
2. Do not invent information.
3. Combine duplicate information where appropriate.
4. Keep the result concise.
5. Return JSON only.
"""

    # --------------------------------------------------------
    # Generate reconstructed profile
    # --------------------------------------------------------

    response = None
    successful_model = None
    last_error = None

    for model in MODELS:

        try:

            print(
                f"Trying profile reconstruction model: {model}"
            )

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response and response.text:

                successful_model = model

                print(
                    f"Profile reconstructed using: {model}"
                )

                break

        except Exception as exc:

            last_error = exc

            print(
                f"Profile reconstruction failed: {exc}"
            )

    # --------------------------------------------------------
    # Check response
    # --------------------------------------------------------

    if response is None or not response.text:

        print(
            "Profile reconstruction returned no response."
        )

        if last_error:

            print(
                f"Last reconstruction error: {last_error}"
            )

        return None

    # --------------------------------------------------------
    # Parse reconstructed profile
    # --------------------------------------------------------

    try:

        profile = extract_json(
            response.text
        )

        profile = normalize_profile(
            profile
        )

        profile["_model_used"] = successful_model

        return profile

    except Exception as exc:

        print(
            f"Profile reconstruction JSON error: {exc}"
        )

        print(
            "Raw reconstruction response:"
        )

        print(response.text)

        return None

