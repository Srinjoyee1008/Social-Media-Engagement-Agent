from app.agent.memory import remember, recall


print("Storing memory...")

remember(
    "The social media agent's audience is mainly AI engineers "
    "and computer science students. The user prefers concise "
    "technical LinkedIn posts with practical examples and minimal emojis."
)

print("Memory stored!")

print("\nRecalling memory...")

result = recall(
    "What does the user prefer when creating LinkedIn content?"
)

print("\nMemories found:")

for memory in result.results:
    print("-", memory.text)