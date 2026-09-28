from app.agent.agent import generate_social_post


result = generate_social_post(
    topic="Retrieval Augmented Generation",
    platform="LinkedIn"
)

print("\n")
print("=" * 60)
print("GENERATED SOCIAL MEDIA POST")
print("=" * 60)

print(result["post"])

print("\n")
print("=" * 60)
print("HINDSIGHT MEMORIES USED")
print("=" * 60)

print(result["memories_used"])