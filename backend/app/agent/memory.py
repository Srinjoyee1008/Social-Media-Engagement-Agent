
import os

from dotenv import load_dotenv
from hindsight_client import Hindsight


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# HINDSIGHT CONFIGURATION
# ============================================================

HINDSIGHT_URL = os.getenv("HINDSIGHT_URL")
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
BANK_ID = os.getenv("HINDSIGHT_BANK_ID")


# ============================================================
# VALIDATION
# ============================================================

if not HINDSIGHT_URL:
    raise RuntimeError(
        "HINDSIGHT_URL is missing from the .env file."
    )

if not HINDSIGHT_API_KEY:
    raise RuntimeError(
        "HINDSIGHT_API_KEY is missing from the .env file."
    )

if not BANK_ID:
    raise RuntimeError(
        "HINDSIGHT_BANK_ID is missing from the .env file."
    )


# ============================================================
# HINDSIGHT CLIENT
# ============================================================

client = Hindsight(
    base_url=HINDSIGHT_URL,
    api_key=HINDSIGHT_API_KEY,
)


# ============================================================
# REMEMBER / RETAIN
# ============================================================

async def remember(content: str):
    """
    Store information in Hindsight.
    """

    if not content or not content.strip():
        raise ValueError(
            "Memory content cannot be empty."
        )

    return await client.aretain(
        bank_id=BANK_ID,
        content=content.strip(),
    )


# ============================================================
# RECALL
# ============================================================

async def recall(query: str):
    """
    Retrieve relevant memories from Hindsight.
    """

    if not query or not query.strip():
        raise ValueError(
            "Recall query cannot be empty."
        )

    return await client.arecall(
        bank_id=BANK_ID,
        query=query.strip(),
    )
