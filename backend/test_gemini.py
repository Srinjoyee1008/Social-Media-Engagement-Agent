import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(
    api_key=os.getenv("LLM_API_KEY")
)

response = client.models.generate_content(
    model="gemini-3.6-flash",
    contents="Write a short LinkedIn post explaining RAG to AI engineers."
)

print("\n========== GEMINI RESPONSE ==========\n")
print(response.text)