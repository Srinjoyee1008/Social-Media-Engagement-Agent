# 🚀 Social Media Engagement Agent

### **An AI-powered social media strategist with persistent professional memory.**

> **Don't just generate content. Build an AI that remembers who you are, what you create, and how your strategy evolves.**

Social Media Engagement Agent is an AI-powered social media assistant designed to create **personalized, memory-aware content** for professionals, creators, developers, startups, and personal brands.

Unlike a traditional LLM application that treats every request as an isolated prompt, this system introduces a **persistent memory layer** using **Hindsight**.

The agent can remember professional profile information, interests, content topics, writing preferences, target audience, and previously generated content — then recall relevant context before generating the next response.

The result is a shift from:

```text
Prompt → Response
```

to:

```text
Experience → Memory → Recall → Reasoning → Response → New Memory
```

---

# ✨ Why This Project?

Creating social media content is not simply a text-generation problem.

A useful social media assistant needs to understand:

* Who the creator is
* What they work on
* What topics they care about
* Who their audience is
* How they communicate
* What content they have already created
* Which preferences should persist across conversations
* How future content can become more personalized

Traditional AI assistants often lose this context when a conversation ends.

### Social Media Engagement Agent adds a persistent memory layer.

```text
Traditional AI

User
  ↓
Prompt
  ↓
LLM
  ↓
Response
  ↓
Context Lost
```

```text
Social Memory Agent

User
  ↓
Relevant Memory
  ↓
AI Reasoning
  ↓
Personalized Content
  ↓
New Experience
  ↓
Persistent Memory
  ↺
```

The goal is not simply to generate more content.

The goal is to make each future interaction **more context-aware than the previous one**.

---

# 🎯 The Core Idea

Imagine an AI assistant that already understands:

```text
Professional Identity
        +
Technical Interests
        +
Writing Style
        +
Target Audience
        +
Previous Content
        +
Content Preferences
```

Now the user asks:

> **"Create a LinkedIn post about AI agents."**

Instead of starting from an empty context window, the agent first recalls relevant memories and uses them to personalize the response.

That creates a simple but powerful loop:

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    Recall    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   Gemini AI  │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │   Response   │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │    Retain    │
                    └──────┬───────┘
                           │
                           └──────────↺
```

### **Recall → Generate → Retain → Improve**

This loop is the foundation of the application.

---

# 🧠 Persistent Agent Memory with Hindsight

The core innovation of the project is the integration of **Hindsight** as the persistent memory layer.

The application uses two important memory operations.

## `RECALL`

Before generating content, the agent searches memory for information relevant to the current request.

```text
User Request
     ↓
Hindsight Recall
     ↓
Relevant Memories
     ↓
Gemini
     ↓
Personalized Response
```

Relevant memories may include:

```text
• Professional profile
• Technical interests
• Writing preferences
• Target audience
• Previous content
• Content topics
```

---

## `RETAIN`

After an interaction, useful information can be stored for future personalization.

```text
Generated Content
       ↓
Hindsight Retain
       ↓
Persistent Memory
       ↓
Future Recall
```

This gives the system a continuous memory cycle:

```text
┌──────────────┐
│    Recall    │
└──────┬───────┘
       ↓
┌──────────────┐
│    Reason    │
└──────┬───────┘
       ↓
┌──────────────┐
│   Generate   │
└──────┬───────┘
       ↓
┌──────────────┐
│    Retain    │
└──────┬───────┘
       ↓
   New Memory
       │
       └──────────────↺
```

---

# 👤 Professional Profile Memory

The application supports importing professional information from multiple sources.

### Supported sources

* LinkedIn
* Naukri
* Indeed
* GitHub
* Portfolio

The current implementation uses **user-supplied profile information** rather than relying on automated platform scraping.

The profile analyzer extracts structured information such as:

```text
Name
Headline
About
Skills
Experience
Education
Interests
Projects
Content Topics
Writing Style
Target Audience
```

The extracted information is then stored in Hindsight as persistent professional memory.

### Why this matters

A profile is not just onboarding information.

It becomes part of the agent's long-term context.

```text
Professional Profile
        ↓
Profile Analysis
        ↓
Structured Context
        ↓
Hindsight Retain
        ↓
Future Personalization
```

---

# ✍️ Personalized Content Generation

Users can provide a topic such as:

```text
AI Agents
RAG
Generative AI
Machine Learning
Cybersecurity
Software Engineering
```

The agent first recalls relevant memories and then provides them to Gemini.

For example:

```text
User:
"Create a LinkedIn post about RAG."

        ↓

Hindsight Recall

        ↓

Relevant Context:
• User works with AI/ML
• User has experience with RAG
• Audience includes developers
• User prefers concise technical writing
• Previous content involved AI projects

        ↓

Gemini

        ↓

Personalized LinkedIn Post

        ↓

Hindsight Retain
```

This makes the generated content more aligned with the user's professional identity.

---

# 🧠 What the Agent Remembers

The memory layer can contain multiple types of information:

```text
┌────────────────────────────┐
│ Professional Profile       │
├────────────────────────────┤
│ Skills & Interests         │
├────────────────────────────┤
│ Writing Style              │
├────────────────────────────┤
│ Target Audience            │
├────────────────────────────┤
│ Content Topics             │
├────────────────────────────┤
│ Previous Generated Content │
└────────────────────────────┘
```

This information provides the foundation for long-term personalization.

---

# 📊 Content Insights

The dashboard can surface useful signals derived from the user's stored professional context.

Examples include:

* Preferred content topics
* Writing style
* Target audience
* Professional interests
* Profile-derived content signals
* Project and skill context

These insights are currently focused on personalization.

They are designed to become the foundation for future **engagement intelligence and content analytics**.

---

# 💻 Dashboard

The application provides a simple web dashboard with dedicated areas for:

### 🏠 Dashboard

View professional profile information and personalization context.

### ✍️ Create Post

Generate personalized social media content from a topic and platform.

### 🧠 Memory

Inspect information remembered by the agent.

### 📊 Insights

Understand the user's professional and content profile.

### 📚 SmartRAG

Connect the broader AI workflow with the user's multimodal RAG study assistant.

---

# 🏗️ System Architecture

```text
                         ┌───────────────┐
                         │     User      │
                         └───────┬───────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │    React + Tailwind    │
                    │       Dashboard        │
                    └───────────┬────────────┘
                                │
                              REST
                                │
                                ▼
                    ┌────────────────────────┐
                    │        FastAPI         │
                    │        Backend         │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │   Social Memory Agent  │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                 RECALL                  RETAIN
                    │                       │
                    └───────────┬───────────┘
                                ▼
                    ┌────────────────────────┐
                    │       Hindsight        │
                    │   Persistent Memory    │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Google Gemini     │
                    │   Reason + Generate    │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ Personalized Content   │
                    └────────────────────────┘
```

---

# 🔄 End-to-End Workflow

## 1. Import Professional Profile

```text
Profile Source
     ↓
Profile Information
     ↓
Gemini Profile Analysis
     ↓
Structured Professional Context
```

## 2. Store Context

```text
Structured Context
       ↓
Hindsight Retain
       ↓
Persistent Memory
```

## 3. Request Content

Example:

```text
Create a LinkedIn post about RAG.
```

## 4. Recall Relevant Memory

```text
User Request
      ↓
Hindsight Recall
      ↓
Relevant Professional Context
```

## 5. Generate

Gemini receives the request together with the relevant recalled context.

```text
Topic
 +
Platform
 +
Professional Context
 +
Writing Preferences
 +
Audience
        ↓
      Gemini
        ↓
 Personalized Content
```

## 6. Retain

The generated interaction can be stored for future personalization.

```text
Generated Content
       ↓
Hindsight Retain
       ↓
Future Context
```

---

# 🛠️ Technology Stack

| Layer           | Technology       |
| --------------- | ---------------- |
| Frontend        | React            |
| Build Tool      | Vite             |
| Styling         | Tailwind CSS     |
| Icons           | Lucide React     |
| Backend         | Python + FastAPI |
| Validation      | Pydantic         |
| AI Model        | Google Gemini    |
| Agent Memory    | Hindsight        |
| API             | REST             |
| Development     | VS Code          |
| Version Control | Git + GitHub     |

---

# 📁 Project Structure

```text
Social-Media-Engagement-Agent/
│
├── backend/
│   ├── app/
│   │   ├── agent/
│   │   │   ├── agent.py
│   │   │   ├── memory.py
│   │   │   └── profile.py
│   │   │
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── package.json
```

> 🔐 **Security:** API credentials are stored locally in `.env` and excluded from version control.

---

# ⚙️ Getting Started

## Prerequisites

Make sure the following are installed:

* Python 3.x
* Node.js
* npm
* Git

You will also need:

* A Hindsight API key
* A Google Gemini API key

---

## 1. Clone the Repository

```bash
git clone https://github.com/Srinjoyee1008/Social-Media-Engagement-Agent.git

cd Social-Media-Engagement-Agent
```

---

# 🔐 2. Configure Environment Variables

Create:

```text
backend/.env
```

Add:

```env
HINDSIGHT_URL=https://api.hindsight.vectorize.io
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BANK_ID=social-memory-agent

LLM_API_KEY=your_gemini_api_key
```

### Never commit `.env`.

The repository uses `.gitignore` to keep credentials outside version control.

---

# 🐍 3. Start the Backend

```bash
cd backend
```

Create a virtual environment:

### Windows

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# ⚛️ 4. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Open the URL shown by Vite, typically:

```text
http://localhost:5173
```

---

# 🧪 API Endpoints

| Method | Endpoint           | Purpose                       |
| ------ | ------------------ | ----------------------------- |
| GET    | `/`                | Application status            |
| GET    | `/health`          | Health check                  |
| POST   | `/generate`        | Generate personalized content |
| GET    | `/memories`        | Retrieve relevant memories    |
| POST   | `/profile/analyze` | Analyze and store profile     |
| GET    | `/dashboard`       | Retrieve dashboard profile    |

### Example `/generate`

```json
{
  "topic": "AI Agents",
  "platform": "LinkedIn"
}
```

### Example `/profile/analyze`

```json
{
  "source": "LinkedIn",
  "profile_url": "https://example.com/profile",
  "profile_text": "Professional profile information..."
}
```

---

# 🔐 Security & Privacy

The project follows basic credential-protection practices.

### Never commit:

```text
.env
API keys
Access tokens
Private credentials
```

Use:

```text
.env.example
```

to document required configuration without exposing secrets.

The current profile workflow relies on **user-supplied profile information** rather than automatically scraping professional platforms.

---

# ⚠️ Current Limitations

The current release is an MVP focused on demonstrating persistent agent memory and personalized content generation.

Current limitations include:

* Profile information is supplied by the user rather than automatically scraped from platforms.
* Real social-platform engagement APIs are not yet integrated.
* Automated publishing and scheduling are not implemented.
* Advanced engagement prediction is not yet implemented.
* Current memory functionality primarily focuses on personalization rather than complete social analytics.
* Platform-specific optimization is currently part of the future roadmap.

These limitations also define the next engineering opportunities.

---

# 🔮 Roadmap

The project is designed to evolve from a personalized content generator into a broader **memory-driven social intelligence platform**.

## Phase 1 — Professional Memory

* Persistent professional profiles
* Multi-source profile context
* Content history
* Writing-style memory
* Audience memory
* Topic preferences
* Project and skill memory

```text
Professional Identity
        ↓
Persistent Memory
        ↓
Personalized Content
```

---

## Phase 2 — Content Intelligence

Future versions can analyze:

* Previous posts
* Content topics
* Formats
* Writing patterns
* Audience reactions
* Repeated themes
* Content consistency

The objective is to understand not only **what the user posts**, but also the patterns behind their content.

---

## Phase 3 — Engagement Intelligence

Future integrations could process metrics such as:

```text
Likes
Comments
Shares
Saves
Reach
Impressions
Click-through Rate
```

This could allow the agent to connect:

```text
Content
   +
Audience Response
   +
Historical Performance
        ↓
Content Intelligence
```

---

## Phase 4 — Personalized Content Strategy

The system could eventually identify patterns across:

```text
Best Topics
     +
Content Formats
     +
Posting Times
     +
Audience Behavior
     +
Historical Performance
```

and turn them into personalized strategy suggestions.

---

## Phase 5 — Multi-Platform Intelligence

Future platform integrations could include:

* LinkedIn
* X
* Instagram
* YouTube
* Facebook

The memory layer could maintain a unified understanding of the creator while allowing the content-generation layer to adapt to each platform.

```text
                 Professional Memory
                         │
          ┌──────────────┼──────────────┐
          ↓              ↓              ↓
       LinkedIn          X          Instagram
          ↓              ↓              ↓
     Platform-specific content
```

---

# 🤖 Long-Term Vision — Autonomous Social Media Copilot

The long-term goal is to move beyond content generation.

```text
Analyze
   ↓
Understand User
   ↓
Understand Audience
   ↓
Plan Content
   ↓
Generate
   ↓
Publish / Schedule
   ↓
Measure
   ↓
Learn
   ↓
Improve
   ↺
```

The eventual system could act as an AI social media strategist that continuously connects:

**identity + memory + content + audience + performance.**

---

# 📈 From Content Generator to Social Intelligence

The key architectural distinction is:

### Traditional AI

```text
Prompt
  ↓
Generate
  ↓
Done
```

### Social Memory Agent

```text
Understand User
       ↓
Recall History
       ↓
Generate Content
       ↓
Store Experience
       ↓
Learn Context
       ↓
Improve Personalization
       ↺
```

The second architecture creates the foundation for an AI system that becomes increasingly context-aware over time.

---

# 💡 Why Hindsight?

A major challenge in AI agents is not simply generating a response.

It is **remembering what matters for the next interaction**.

Hindsight provides the persistent memory layer that enables the application to move from:

```text
Prompt → Response
```

toward:

```text
Experience
    ↓
Memory
    ↓
Recall
    ↓
Reasoning
    ↓
Better Response
    ↓
New Experience
```

This makes memory a core architectural component rather than an afterthought.

---

# 🎯 Use Cases

## 👩‍💻 Individual Professionals

Maintain a consistent professional identity and writing style.

## 🚀 Startups

Generate content aligned with product positioning, audience, and brand context.

## 📱 Social Media Managers

Reduce repetitive research and personalization work.

## 🧑‍💼 Personal Brands

Maintain consistent messaging across long-term content campaigns.

## 🏢 Marketing Teams

Create a foundation for memory-driven content intelligence.

## 🤖 AI Agent Developers

Demonstrate how persistent memory can transform a stateless LLM application into a context-aware agent.

---

# 🧩 Product Evolution

The project can evolve through three major layers:

```text
                 ┌─────────────────────┐
                 │   Social Strategy   │
                 │   & Intelligence    │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │  Content & Audience │
                 │     Intelligence    │
                 └──────────┬──────────┘
                            │
                 ┌──────────▼──────────┐
                 │ Persistent Memory   │
                 │      Layer          │
                 └─────────────────────┘
```

### Today

**Memory-aware content generation**

### Next

**Content + engagement intelligence**

### Eventually

**Continuous AI social strategy**

---

# 🏆 Project Status

**Status:** Functional MVP

**Primary Focus:** Persistent AI memory + personalized social content generation

**Architecture:**

```text
React
  +
FastAPI
  +
Gemini
  +
Hindsight
```

**Current Direction:**

```text
Personalized Content
        ↓
Professional Memory
        ↓
Content Intelligence
        ↓
Engagement Intelligence
        ↓
Social Media Copilot
```

---

# 👥 Team

Built as a collaborative project with responsibilities across:

* AI & Hindsight integration
* Backend development
* Frontend development
* Product design
* Documentation
* Demonstration

---

# 📜 License

This project can be released under an appropriate open-source license depending on the team's intended usage and distribution model.

---

# ⭐ Support the Project

If you find the project useful:

* ⭐ Star the repository
* 🍴 Fork the project
* 💡 Open an issue
* 🚀 Build on top of it
* 📢 Share the project

---

# 🚀 The Bigger Idea

Social media is not only about producing more posts.

It is about understanding:

```text
Who you are
     +
What you create
     +
Who you speak to
     +
What you've already tried
     +
What your audience responds to
     +
How your strategy evolves
```

**Social Media Engagement Agent brings persistent AI memory into that process.**

> ### **Don't just generate the next post.**
>
> ### **Remember what happened before it.**
>
> ### **Learn from it.**
>
> ### **Make the next one smarter.**

---

## 🧠 Built With

**React · FastAPI · Google Gemini · Hindsight · Tailwind CSS · Python · Git**

**More than a content generator — a foundation for an AI social media strategist with memory.**
