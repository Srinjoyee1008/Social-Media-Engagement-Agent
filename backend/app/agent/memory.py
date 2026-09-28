import os
from hindsight_client import Hindsight
from dotenv import load_dotenv

load_dotenv()

client = Hindsight(
    base_url=os.getenv("HINDSIGHT_URL"),
    api_key=os.getenv("HINDSIGHT_API_KEY")
)

BANK_ID = os.getenv("HINDSIGHT_BANK_ID")


def remember(content: str):
    return client.retain(
        bank_id=BANK_ID,
        content=content
    )


def recall(query: str):
    return client.recall(
        bank_id=BANK_ID,
        query=query
    )