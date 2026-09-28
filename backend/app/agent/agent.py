import os
from dotenv import load_dotenv
from google import genai

from app.agent.memory import remember, recall

load_dotenv()

# Gemini client
client = genai.Client(
    api_key=os.getenv("LLM_API_KEY")
)

# Gemini models to try
MODELS = [
    "gemini-3.6-flash",
    "gemini-3.6-flash-lite",
]


def generate_social_post(topic: str, platform: str = "LinkedIn"):

    # -----------------------------------------
    # 1. RECALL: Get relevant memories
    # -----------------------------------------

    memories = recall(
        f"""
        Find memories relevant to creating a {platform}
        social media post about {topic}.

        Look for:
        - user writing preferences
        - audience preferences
        - previous content
        - engagement patterns
        """
    )

    # Convert memories into readable text
    memory_text = "\n".join(
        f"- {memory.text}"
        for memory in memories
    )

    # -----------------------------------------
    # 2. CREATE GEMINI PROMPT
    # -----------------------------------------

    prompt = f"""
You are Social Memory Agent, an AI assistant
that creates personalized social media content.

Platform:
{platform}

Topic:
{topic}

Relevant memories from Hindsight:
{memory_text}

These memories may contain the user's professional profile,
skills, interests, audience, writing style, and previous content.

Use the persistent memories to personalize the post.

The goal is to make the generated content feel consistent
with the user's professional identity and previous content.

Requirements:
- Write a high-quality {platform} post.
- Match the user's known writing preferences.
- Match the audience.
- Use practical technical information.
- Keep it concise.
- Avoid unnecessary emojis.
- Do not mention that you are an AI.
- Do not mention Hindsight.
- Make the opening interesting.
"""

    # -----------------------------------------
    # 3. GENERATE WITH GEMINI
    # -----------------------------------------

    response = None

    for model in MODELS:
        try:
            print(f"Trying Gemini model: {model}")

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response and response.text:
                print(f"Successfully generated using: {model}")
                break

        except Exception as e:
            print(f"Model {model} failed: {e}")

    # Check whether generation succeeded
    if response is None or not response.text:
        raise RuntimeError(
            "All Gemini models are currently unavailable. "
            "Please try again."
        )

    post = response.text

    # -----------------------------------------
    # 4. RETAIN NEW MEMORY IN HINDSIGHT
    # -----------------------------------------

    remember(
        f"""
        The user created a {platform} post about {topic}.

        The generated content was:

        {post}
        """
    )

    # -----------------------------------------
    # 5. RETURN RESULT TO FASTAPI
    # -----------------------------------------

    return {
        "post": post,
        "memories_used": memory_text
    }