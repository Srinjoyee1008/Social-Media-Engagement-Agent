
import json
import os
import re

from dotenv import load_dotenv
from google import genai

from app.agent.memory import remember, recall


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# CONFIGURATION
# ============================================================

LLM_API_KEY = os.getenv("LLM_API_KEY")

if not LLM_API_KEY:
    raise RuntimeError(
        "LLM_API_KEY is not configured. "
        "Please add it to backend/.env."
    )


# ============================================================
# GEMMA CLIENT
# ============================================================

client = genai.Client(
    api_key=LLM_API_KEY
)


# ============================================================
# GEMMA MODELS
# ============================================================

PRIMARY_MODEL = "gemma-4-31b-it"

FALLBACK_MODEL = "gemma-4-26b-a4b-it"


# ============================================================
# GENERATION CONFIGURATION
# ============================================================

# Number of candidate posts to generate.
NUM_CANDIDATE_POSTS = 5

# Maximum number of Hindsight memories sent to Gemma.
MAX_MEMORIES = 10

# Prevent one huge memory from making the prompt too large.
MAX_MEMORY_LENGTH = 1200

# Maximum length of a generated post.
MAX_POST_LENGTH = 5000


# ============================================================
# MEMORY FORMATTING
# ============================================================

def format_memories(memories):
    """
    Convert Hindsight memory objects into a compact text block.
    """

    if not memories:
        return "No relevant professional memories were found."

    formatted = []

    for index, memory in enumerate(
        memories[:MAX_MEMORIES],
        start=1
    ):
        text = getattr(memory, "text", None)

        if text is None and isinstance(memory, str):
            text = memory

        if not text:
            continue

        text = str(text).strip()

        if not text:
            continue

        if len(text) > MAX_MEMORY_LENGTH:
            text = (
                text[:MAX_MEMORY_LENGTH]
                + "..."
            )

        formatted.append(
            f"{index}. {text}"
        )

    if not formatted:
        return "No usable memories were found."

    return "\n".join(formatted)


# ============================================================
# JSON EXTRACTION
# ============================================================

def extract_json(text: str):
    """
    Safely extract JSON from an LLM response.

    Handles:
    - plain JSON
    - ```json ... ```
    - ``` ... ```
    - extra text surrounding JSON
    """

    if not text:
        raise ValueError("Empty model response.")

    text = text.strip()

    # Remove Markdown code fences.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # First attempt: complete response is JSON.
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Second attempt: find JSON object.
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # Third attempt: find JSON array.
    start = text.find("[")
    end = text.rfind("]")

    if start != -1 and end != -1 and end > start:
        candidate = text[start:end + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Could not extract valid JSON from Gemma response."
    )


# ============================================================
# GEMMA TEXT GENERATION
# ============================================================

def generate_with_gemma(prompt: str):
    """
    Generate content using Gemma.

    Primary model is attempted first.
    Fallback model is attempted if primary fails.

    Returns:
        tuple[str, str]:
            generated response
            model used
    """

    models = [
        PRIMARY_MODEL,
        FALLBACK_MODEL,
    ]

    last_error = None

    for model in models:

        print(
            f"\nTrying model: {model}"
        )

        try:

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            if response is None:

                print(
                    f"{model} returned no response."
                )

                continue

            generated_text = getattr(
                response,
                "text",
                None
            )

            if generated_text:
                generated_text = (
                    generated_text.strip()
                )

            if generated_text:

                print(
                    f"Generation successful using {model}"
                )

                return (
                    generated_text,
                    model
                )

            print(
                f"{model} returned an empty response."
            )

        except Exception as error:

            last_error = error

            print(
                f"\nModel failed: {model}"
            )

            print(
                f"Error type: {type(error).__name__}"
            )

            print(
                f"Error: {error}"
            )

    raise RuntimeError(
        "Gemma generation failed for all configured models. "
        f"Last error: {last_error}"
    )


# ============================================================
# MULTI-POST GENERATION PROMPT
# ============================================================

def build_multi_post_prompt(
    topic: str,
    platform: str,
    memory_text: str
):
    """
    Build prompt for generating five different candidate posts.
    """

    return f"""
You are Social Memory Agent, an AI-powered professional
social media content assistant.

Your task is to generate exactly {NUM_CANDIDATE_POSTS}
different social media posts.

PLATFORM:
{platform}

TOPIC:
{topic}

RELEVANT PROFESSIONAL MEMORIES:
{memory_text}

============================================================
PERSONALIZATION RULES
============================================================

Use relevant information from the memories, including:

- professional identity
- skills
- projects
- interests
- writing style
- target audience
- previous content
- professional goals

Only use information explicitly supported by memory.

NEVER invent:

- achievements
- employment
- education
- projects
- skills
- certifications
- experience
- awards
- statistics about the user

If information is unavailable, do not mention it.

============================================================
POST REQUIREMENTS
============================================================

Generate five substantially different posts.

Each candidate should use a different approach.

Possible approaches include:

1. Technical insight
2. Personal learning
3. Practical example
4. Problem/solution
5. Thought-provoking professional perspective

Do NOT simply rewrite the same post five times.

Every post must be:

- professional
- authentic
- clear
- technically informed
- practical
- concise
- natural
- suitable for {platform}

Avoid:

- excessive emojis
- excessive hashtags
- generic motivational language
- exaggerated claims
- fake personal experiences
- clickbait
- repetitive openings

============================================================
OUTPUT FORMAT
============================================================

Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not explain the response.

Use exactly this structure:

{{
    "posts": [
        {{
            "id": 1,
            "content": "Post content here"
        }},
        {{
            "id": 2,
            "content": "Post content here"
        }},
        {{
            "id": 3,
            "content": "Post content here"
        }},
        {{
            "id": 4,
            "content": "Post content here"
        }},
        {{
            "id": 5,
            "content": "Post content here"
        }}
    ]
}}
""".strip()


# ============================================================
# VALIDATE CANDIDATE POSTS
# ============================================================

def normalize_candidate_posts(data):
    """
    Validate and normalize Gemma's multi-post JSON response.
    """

    if not isinstance(data, dict):
        raise ValueError(
            "Candidate response must be a JSON object."
        )

    posts = data.get("posts")

    if not isinstance(posts, list):
        raise ValueError(
            "Candidate response does not contain a posts list."
        )

    normalized = []

    for index, item in enumerate(posts, start=1):

        if not isinstance(item, dict):
            continue

        content = item.get("content")

        if not content:
            continue

        content = str(content).strip()

        if not content:
            continue

        if len(content) > MAX_POST_LENGTH:
            content = content[:MAX_POST_LENGTH].rstrip() + "..."

        normalized.append(
            {
                "id": index,
                "content": content
            }
        )

    if len(normalized) < NUM_CANDIDATE_POSTS:
        raise ValueError(
            f"Gemma generated only {len(normalized)} valid posts. "
            f"Expected {NUM_CANDIDATE_POSTS}."
        )

    return normalized[:NUM_CANDIDATE_POSTS]


# ============================================================
# EVALUATION PROMPT
# ============================================================

def build_evaluation_prompt(
    topic: str,
    platform: str,
    memory_text: str,
    posts: list
):
    """
    Build prompt for evaluating and classifying candidate posts.
    """

    posts_text = "\n\n".join(
        [
            f"POST {post['id']}:\n{post['content']}"
            for post in posts
        ]
    )

    return f"""
You are a strict social media quality evaluator.

Evaluate five candidate {platform} posts about:

TOPIC:
{topic}

USER MEMORY:
{memory_text}

============================================================
CANDIDATE POSTS
============================================================

{posts_text}

============================================================
SCORING RUBRIC
============================================================

Score every post from 0 to 100.

1. RELEVANCE TO TOPIC — 20 points

Does the post directly and meaningfully address the topic?

2. PERSONALIZATION — 20 points

Does the post naturally match the user's professional identity,
skills, projects, interests, writing style, and audience?

Only award personalization points when supported by memory.

3. TECHNICAL / PRACTICAL VALUE — 15 points

Does the post provide useful technical knowledge,
practical insight, or a concrete example?

4. ENGAGEMENT POTENTIAL — 15 points

Does the opening create interest?
Would the intended professional audience want to read or
respond to it?

5. CLARITY — 10 points

Is the post easy to understand and well structured?

6. AUTHENTICITY — 10 points

Does it sound natural and credible rather than generic,
exaggerated, or artificially motivational?

7. PLATFORM SUITABILITY — 10 points

Does it fit the conventions of {platform}?

============================================================
GRADING
============================================================

A = 90-100
Meaning: Publish Ready

B = 75-89
Meaning: Good, minor editing recommended

C = 60-74
Meaning: Needs Improvement

D = 0-59
Meaning: Reject or regenerate

============================================================
IMPORTANT
============================================================

Be strict.

Penalize:

- hallucinated achievements
- unsupported personal claims
- generic content
- repetitive writing
- excessive emojis
- excessive hashtags
- weak hooks
- vague technical claims
- unnecessary filler

Do not give every post a high score.

The scores should meaningfully distinguish strong posts
from weak posts.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Do not use Markdown.
Do not use code fences.
Do not explain your reasoning.

Use exactly this structure:

{{
    "evaluations": [
        {{
            "post_id": 1,
            "score": 94,
            "grade": "A",
            "reason": "Short explanation."
        }},
        {{
            "post_id": 2,
            "score": 82,
            "grade": "B",
            "reason": "Short explanation."
        }},
        {{
            "post_id": 3,
            "score": 68,
            "grade": "C",
            "reason": "Short explanation."
        }},
        {{
            "post_id": 4,
            "score": 55,
            "grade": "D",
            "reason": "Short explanation."
        }},
        {{
            "post_id": 5,
            "score": 91,
            "grade": "A",
            "reason": "Short explanation."
        }}
    ]
}}
""".strip()


# ============================================================
# GRADE CALCULATION
# ============================================================

def calculate_grade(score):
    """
    Convert numerical score into A/B/C/D classification.
    """

    try:
        score = int(score)
    except (TypeError, ValueError):
        return "D"

    score = max(0, min(100, score))

    if score >= 90:
        return "A"

    if score >= 75:
        return "B"

    if score >= 60:
        return "C"

    return "D"


# ============================================================
# NORMALIZE EVALUATIONS
# ============================================================

def normalize_evaluations(data, posts):
    """
    Validate evaluator output and combine it with candidate posts.
    """

    if not isinstance(data, dict):
        raise ValueError(
            "Evaluation response must be a JSON object."
        )

    evaluations = data.get("evaluations")

    if not isinstance(evaluations, list):
        raise ValueError(
            "Evaluation response does not contain evaluations."
        )

    evaluation_map = {}

    for evaluation in evaluations:

        if not isinstance(evaluation, dict):
            continue

        post_id = evaluation.get("post_id")

        try:
            post_id = int(post_id)
        except (TypeError, ValueError):
            continue

        try:
            score = int(evaluation.get("score", 0))
        except (TypeError, ValueError):
            score = 0

        score = max(0, min(100, score))

        reason = str(
            evaluation.get(
                "reason",
                "No evaluation reason provided."
            )
        ).strip()

        evaluation_map[post_id] = {
            "score": score,
            "grade": calculate_grade(score),
            "reason": reason
        }

    final_posts = []

    for post in posts:

        post_id = post["id"]

        evaluation = evaluation_map.get(
            post_id,
            {
                "score": 0,
                "grade": "D",
                "reason": "No valid evaluation was returned."
            }
        )

        final_posts.append(
            {
                "id": post_id,
                "content": post["content"],
                "score": evaluation["score"],
                "grade": evaluation["grade"],
                "reason": evaluation["reason"]
            }
        )

    return final_posts


# ============================================================
# SAVE COMPLETE RESULT TO HINDSIGHT
# ============================================================

async def save_generated_posts(
    topic: str,
    platform: str,
    model_used: str,
    posts: list,
    best_post: dict
):
    """
    Store generated candidates, their classifications,
    and the selected best post in Hindsight.
    """

    print(
        "\nSaving generated posts to Hindsight..."
    )

    try:

        candidates_text = "\n\n".join(
            [
                (
                    f"POST {post['id']}\n"
                    f"Grade: {post['grade']}\n"
                    f"Score: {post['score']}/100\n"
                    f"Reason: {post['reason']}\n"
                    f"Content:\n{post['content']}"
                )
                for post in posts
            ]
        )

        memory_content = f"""
SOCIAL MEMORY AGENT - GENERATED CONTENT

Platform:
{platform}

Topic:
{topic}

Generation Model:
{model_used}

Number of Candidates:
{len(posts)}

SELECTED BEST POST

Post ID:
{best_post["id"]}

Grade:
{best_post["grade"]}

Score:
{best_post["score"]}/100

Reason:
{best_post["reason"]}

Content:
{best_post["content"]}

ALL CANDIDATE POSTS

{candidates_text}
""".strip()

        await remember(
            memory_content
        )

        print(
            "Generated posts and evaluation successfully "
            "stored in Hindsight."
        )

        return True

    except Exception as error:

        print(
            "\nWarning: Failed to store generated posts."
        )

        print(
            f"Memory error type: {type(error).__name__}"
        )

        print(
            f"Memory error: {error}"
        )

        return False


# ============================================================
# GENERATE FIVE CANDIDATE POSTS
# ============================================================

def generate_candidate_posts(
    topic: str,
    platform: str,
    memory_text: str
):
    """
    Generate five candidate posts using Gemma.
    """

    prompt = build_multi_post_prompt(
        topic=topic,
        platform=platform,
        memory_text=memory_text
    )

    print(
        "\nGenerating five candidate posts..."
    )

    raw_response, model_used = generate_with_gemma(
        prompt
    )

    print(
        "\nParsing candidate posts..."
    )

    try:

        data = extract_json(
            raw_response
        )

        posts = normalize_candidate_posts(
            data
        )

    except Exception as error:

        print(
            "\nCandidate JSON parsing failed."
        )

        print(
            f"Error type: {type(error).__name__}"
        )

        print(
            f"Error: {error}"
        )

        raise RuntimeError(
            "Gemma generated an invalid candidate-post response. "
            f"Details: {error}"
        )

    print(
        f"Successfully generated {len(posts)} candidate posts."
    )

    return posts, model_used


# ============================================================
# EVALUATE CANDIDATE POSTS
# ============================================================

def evaluate_candidate_posts(
    topic: str,
    platform: str,
    memory_text: str,
    posts: list
):
    """
    Evaluate five candidate posts and assign A/B/C/D grades.
    """

    prompt = build_evaluation_prompt(
        topic=topic,
        platform=platform,
        memory_text=memory_text,
        posts=posts
    )

    print(
        "\nEvaluating candidate posts..."
    )

    raw_response, evaluator_model = generate_with_gemma(
        prompt
    )

    print(
        "\nParsing evaluation results..."
    )

    try:

        data = extract_json(
            raw_response
        )

        evaluated_posts = normalize_evaluations(
            data,
            posts
        )

    except Exception as error:

        print(
            "\nEvaluation JSON parsing failed."
        )

        print(
            f"Error type: {type(error).__name__}"
        )

        print(
            f"Error: {error}"
        )

        raise RuntimeError(
            "Gemma generated an invalid evaluation response. "
            f"Details: {error}"
        )

    # Highest score first.
    evaluated_posts.sort(
        key=lambda post: post["score"],
        reverse=True
    )

    print(
        "\nEvaluation complete:"
    )

    for rank, post in enumerate(
        evaluated_posts,
        start=1
    ):
        print(
            f"{rank}. "
            f"Post {post['id']} → "
            f"{post['grade']} "
            f"({post['score']}/100)"
        )

    return evaluated_posts, evaluator_model


# ============================================================
# MAIN SOCIAL MEMORY AGENT
# ============================================================

async def generate_social_post(
    topic: str,
    platform: str = "LinkedIn"
):
    """
    Main Social Memory Agent workflow.

    Workflow:

        User Topic
             ↓
        Hindsight Recall
             ↓
        Relevant Memories
             ↓
        Generate 5 Candidate Posts
             ↓
        Evaluate Candidates
             ↓
        A/B/C/D Classification
             ↓
        Rank by Score
             ↓
        Select Best Post
             ↓
        Hindsight Retain
             ↓
        Return Results
    """

    # ========================================================
    # VALIDATE INPUT
    # ========================================================

    if topic is None:
        raise ValueError(
            "Topic cannot be empty."
        )

    if platform is None:
        platform = "LinkedIn"

    topic = str(topic).strip()
    platform = str(platform).strip()

    if not topic:
        raise ValueError(
            "Topic cannot be empty."
        )

    if not platform:
        platform = "LinkedIn"


    # ========================================================
    # START LOGGING
    # ========================================================

    print(
        "\n========================================"
    )

    print(
        "SOCIAL MEMORY AGENT"
    )

    print(
        "========================================"
    )

    print(
        f"\nPlatform: {platform}"
    )

    print(
        f"Topic: {topic}"
    )


    # ========================================================
    # 1. RECALL MEMORIES
    # ========================================================

    print(
        "\nRecalling relevant memories from Hindsight..."
    )

    try:

        memories = await recall(
            f"""
Find the most relevant professional memories for creating
multiple {platform} social media posts about:

{topic}

Prioritize:

- professional identity
- skills
- projects
- interests
- writing style
- target audience
- content topics
- previous social media content
- previous generated posts
""".strip()
        )

        if memories is None:
            memories = []

    except Exception as error:

        print(
            "\nHindsight recall failed."
        )

        print(
            f"Error type: {type(error).__name__}"
        )

        print(
            f"Error: {error}"
        )

        # The agent can still generate content without memory.
        memories = []


    # ========================================================
    # 2. LIMIT MEMORIES
    # ========================================================

    total_memories = len(memories)

    selected_memories = memories[
        :MAX_MEMORIES
    ]

    print(
        f"\nHindsight memories retrieved: "
        f"{total_memories}"
    )

    print(
        f"Memories sent to Gemma: "
        f"{len(selected_memories)}"
    )


    # ========================================================
    # 3. FORMAT MEMORIES
    # ========================================================

    memory_text = format_memories(
        selected_memories
    )


    # ========================================================
    # 4. GENERATE FIVE CANDIDATES
    # ========================================================

    candidate_posts, generation_model = (
        generate_candidate_posts(
            topic=topic,
            platform=platform,
            memory_text=memory_text
        )
    )


    # ========================================================
    # 5. EVALUATE CANDIDATES
    # ========================================================

    evaluated_posts, evaluator_model = (
        evaluate_candidate_posts(
            topic=topic,
            platform=platform,
            memory_text=memory_text,
            posts=candidate_posts
        )
    )


    # ========================================================
    # 6. SELECT BEST POST
    # ========================================================

    if not evaluated_posts:
        raise RuntimeError(
            "No evaluated posts were returned."
        )

    best_post = evaluated_posts[0]

    print(
        "\n========================================"
    )

    print(
        "BEST POST SELECTED"
    )

    print(
        "========================================"
    )

    print(
        f"Post ID: {best_post['id']}"
    )

    print(
        f"Grade: {best_post['grade']}"
    )

    print(
        f"Score: {best_post['score']}/100"
    )

    print(
        f"Reason: {best_post['reason']}"
    )


    # ========================================================
    # 7. SAVE EVERYTHING TO HINDSIGHT
    # ========================================================

    memory_saved = await save_generated_posts(
        topic=topic,
        platform=platform,
        model_used=generation_model,
        posts=evaluated_posts,
        best_post=best_post
    )


    # ========================================================
    # 8. RETURN RESULT
    # ========================================================

    result = {
        "topic": topic,
        "platform": platform,

        "model_used": generation_model,

        "evaluator_model": evaluator_model,

        "total_candidates": len(evaluated_posts),

        "posts": evaluated_posts,

        "best_post": best_post,

        "memory_saved": memory_saved
    }


    # ========================================================
    # FINAL LOGGING
    # ========================================================

    print(
        "\n========================================"
    )

    print(
        "GENERATION COMPLETE"
    )

    print(
        f"Candidates: {len(evaluated_posts)}"
    )

    print(
        f"Best grade: {best_post['grade']}"
    )

    print(
        f"Best score: {best_post['score']}/100"
    )

    print(
        f"Generation model: {generation_model}"
    )

    print(
        f"Evaluator model: {evaluator_model}"
    )

    print(
        f"Memory saved: {memory_saved}"
    )

    print(
        "========================================\n"
    )

    return result
