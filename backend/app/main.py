
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from app.agent.agent import generate_social_post
from app.agent.profile import analyze_profile, get_profile


app = FastAPI(
    title="Social Memory Agent",
    description="AI social media agent with persistent memory",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class PostRequest(BaseModel):
    topic: str
    platform: str = "LinkedIn"


class ProfileRequest(BaseModel):
    source: str = "LinkedIn"
    profile_url: str
    profile_text: str


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Social Memory Agent is running!",
        "status": "ok"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ============================================================
# SOCIAL POST GENERATION
# ============================================================

@app.post("/generate")
async def generate_post(request: PostRequest):

    result = await generate_social_post(
        topic=request.topic,
        platform=request.platform
    )

    return result


# ============================================================
# HINDSIGHT MEMORIES
# ============================================================

@app.get("/memories")
async def get_memories():

    from app.agent.memory import recall

    memories = await recall(
        """
        Retrieve all useful memories about:

        - user preferences
        - audience preferences
        - previous social media posts
        - content style
        - engagement patterns
        - professional profile
        - profile sources
        """
    )

    return {
        "memories": [
            {
                "text": memory.text
            }
            for memory in memories
        ]
    }


# ============================================================
# PROFILE IMPORT
# ============================================================

@app.post("/profile/analyze")
async def profile_analyze(request: ProfileRequest):

    profile = await analyze_profile(
        profile_url=request.profile_url,
        profile_text=request.profile_text,
        source=request.source
    )

    return {
        "success": True,
        "source": request.source,
        "profile": profile
    }


# ============================================================
# DASHBOARD PROFILE
# ============================================================

@app.get("/dashboard")
async def dashboard():

    profile = await get_profile()

    return {
        "profile": profile,
        "profile_imported": profile is not None
    }

