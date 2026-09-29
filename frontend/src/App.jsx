
import { useEffect, useState } from "react"
import {
  Brain,
  Sparkles,
  LayoutDashboard,
  PenSquare,
  Database,
  BarChart3,
  Settings,
  ChevronDown,
  Copy,
  Check,
  RefreshCw,
  Activity,
  Users,
  Zap,
  Link,
  UserCircle,
  BookOpen,
} from "lucide-react"

function App() {
  const [activePage, setActivePage] = useState("Dashboard")

  // -----------------------------------------
  // CREATE POST STATE
  // -----------------------------------------

  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("LinkedIn")
  const [post, setPost] = useState("")
  const [memoriesUsed, setMemoriesUsed] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // -----------------------------------------
  // HINDSIGHT MEMORY STATE
  // -----------------------------------------

  const [memories, setMemories] = useState([])
  const [memoryLoading, setMemoryLoading] = useState(false)

  // -----------------------------------------
  // PROFILE STATE
  // -----------------------------------------

  const [profile, setProfile] = useState(null)
  const [profileSource, setProfileSource] = useState("LinkedIn")
  const [profileUrl, setProfileUrl] = useState("")
  const [profileText, setProfileText] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState("")

  // -----------------------------------------
  // SMART RAG
  // -----------------------------------------

  const openSmartRAG = () => {
    window.open("http://localhost:8501", "_blank", "noopener,noreferrer")
  }

  // -----------------------------------------
  // LOAD MEMORIES FROM HINDSIGHT
  // -----------------------------------------

  const loadMemories = async () => {
    setMemoryLoading(true)

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/memories"
      )

      if (!response.ok) {
        throw new Error("Failed to load memories")
      }

      const data = await response.json()

      setMemories(data.memories || [])
    } catch (error) {
      console.error("Memory loading error:", error)
      setMemories([])
    } finally {
      setMemoryLoading(false)
    }
  }

  // -----------------------------------------
  // LOAD DASHBOARD PROFILE
  // -----------------------------------------

  const loadDashboard = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/dashboard"
      )

      if (!response.ok) {
        throw new Error("Failed to load dashboard")
      }

      const data = await response.json()

      setProfile(data.profile || null)
    } catch (error) {
      console.error("Dashboard loading error:", error)
      setProfile(null)
    }
  }

  // -----------------------------------------
  // INITIAL LOAD
  // -----------------------------------------

  useEffect(() => {
    loadMemories()
    loadDashboard()
  }, [])

  // -----------------------------------------
  // IMPORT + ANALYZE PROFILE
  // -----------------------------------------

  const importProfile = async () => {
    if (!profileUrl.trim()) {
      setProfileMessage(
        "Please enter your professional profile URL."
      )
      return
    }

    if (!profileText.trim()) {
      setProfileMessage(
        "Please paste your public profile information."
      )
      return
    }

    setProfileLoading(true)
    setProfileMessage("Analyzing profile with Gemini...")

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/profile/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source: profileSource,
            profile_url: profileUrl,
            profile_text: profileText,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.detail || "Profile analysis failed."
        )
      }

      setProfile(data.profile || null)

      setProfileMessage(
        "Profile analyzed and stored in Hindsight successfully."
      )

      await loadMemories()
      await loadDashboard()
    } catch (error) {
      console.error("Profile import error:", error)

      setProfileMessage(
        error.message ||
          "Unable to analyze the profile."
      )
    } finally {
      setProfileLoading(false)
    }
  }

  // -----------------------------------------
  // GENERATE SOCIAL MEDIA POST
  // -----------------------------------------

  const generatePost = async () => {
    if (!topic.trim()) return

    setLoading(true)
    setPost("")
    setMemoriesUsed("")

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic,
            platform,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to generate post")
      }

      const data = await response.json()

      setPost(data.post || "")
      setMemoriesUsed(data.memories_used || "")

      await loadMemories()
      await loadDashboard()
    } catch (error) {
      console.error("Generation error:", error)

      setPost(
        "Unable to connect to the Social Memory Agent. Make sure the FastAPI server is running."
      )
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // COPY GENERATED POST
  // -----------------------------------------

  const copyPost = async () => {
    if (!post) return

    try {
      await navigator.clipboard.writeText(post)

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  // -----------------------------------------
  // NAVIGATION
  // -----------------------------------------

  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Create Post",
      icon: PenSquare,
    },
    {
      name: "Memory",
      icon: Database,
    },
    {
      name: "Insights",
      icon: BarChart3,
    },
  ]

  // -----------------------------------------
  // DASHBOARD PAGE
  // -----------------------------------------

  const renderDashboard = () => {
    return (
      <div className="space-y-6">

        {/* Page Header */}

        <div>
          <h3 className="text-2xl font-bold text-slate-900">
            Agent Dashboard
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Build persistent memory from your professional profile.
          </p>
        </div>

        {/* PROFILE IMPORT */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <UserCircle
                size={24}
                className="text-violet-600"
              />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Import Your Professional Profile
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Give your agent profile information so it can
                understand your expertise, audience, interests,
                and writing style.
              </p>
            </div>

          </div>

          <div className="space-y-4">

            {/* LinkedIn URL */}

            {/* Profile Source */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Professional Profile Source
              </label>

              <div className="relative">

                <select
                  value={profileSource}
                  onChange={(e) => setProfileSource(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Naukri">Naukri</option>
                  <option value="Indeed">Indeed</option>
                  <option value="GitHub">GitHub</option>
                  <option value="Portfolio">Portfolio</option>
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

            {/* Profile URL */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Profile URL
              </label>

              <div className="relative">

                <Link
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={profileUrl}
                  onChange={(e) =>
                    setProfileUrl(e.target.value)
                  }
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                />

              </div>

            </div>

            {/* Profile Text */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Profile Information
              </label>

              <textarea
                value={profileText}
                onChange={(e) =>
                  setProfileText(e.target.value)
                }
                placeholder="Paste your public profile information, resume content, bio, skills, projects, or professional details..."
                rows={7}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
              />

              <p className="mt-2 text-xs text-slate-400">
                The URL is used as a source reference. The information you provide is analyzed and converted into persistent Hindsight memories.
              </p>

            </div>

            {/* Import Button */}

            <button
              onClick={importProfile}
              disabled={
                profileLoading ||
                !profileUrl.trim() ||
                !profileText.trim()
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >

              {profileLoading ? (
                <>
                  <RefreshCw
                    size={17}
                    className="animate-spin"
                  />

                  Analyzing Profile...
                </>
              ) : (
                <>
                  <Sparkles size={17} />

                  Analyze & Remember Profile
                </>
              )}

            </button>

            {/* Message */}

            {profileMessage && (
              <div
                className={`rounded-xl p-4 text-sm ${
                  profileMessage.includes("successfully")
                    ? "bg-emerald-50 text-emerald-700"
                    : profileMessage.includes("Analyzing")
                    ? "bg-violet-50 text-violet-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {profileMessage}
              </div>
            )}

          </div>

        </section>

        {/* PROFILE MEMORY */}

        {profile && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Brain
                    size={19}
                    className="text-emerald-600"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-slate-900">
                    Your Profile Memory
                  </h3>

                  <p className="text-xs text-slate-400">
                    Stored and available to the agent
                  </p>
                </div>

              </div>

              <div className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Memory Active
              </div>

            </div>

            {/* Name + Headline */}

            {profile?.source && (
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
              <Link size={13} />
              Source: {profile.source}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Name
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {profile.name || "Not available"}
                </p>

              </div>

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Headline
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {profile.headline || "Not available"}
                </p>

              </div>

              {/* About */}

              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  About
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {profile.about || "Not available"}
                </p>

              </div>

              {/* Skills */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Skills
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  {(profile.skills || []).length === 0 ? (
                    <span className="text-sm text-slate-400">
                      No skills detected
                    </span>
                  ) : (
                    profile.skills.map((skill, index) => (
                      <span
                        key={`${skill}-${index}`}
                        className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700"
                      >
                        {skill}
                      </span>
                    ))
                  )}

                </div>

              </div>

              {/* Content Topics */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Content Topics
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  {(profile.content_topics || []).length === 0 ? (
                    <span className="text-sm text-slate-400">
                      No topics detected
                    </span>
                  ) : (
                    profile.content_topics.map(
                      (topicItem, index) => (
                        <span
                          key={`${topicItem}-${index}`}
                          className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700"
                        >
                          {topicItem}
                        </span>
                      )
                    )
                  )}

                </div>

              </div>

              {/* Writing Style */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Writing Style
                </p>

                {(profile.writing_style || []).length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No writing style detected
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">

                    {profile.writing_style.map(
                      (style, index) => (
                        <li
                          key={`${style}-${index}`}
                          className="text-sm text-slate-700"
                        >
                          • {style}
                        </li>
                      )
                    )}

                  </ul>
                )}

              </div>

              {/* Target Audience */}

              <div className="rounded-xl bg-slate-50 p-4">

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Target Audience
                </p>

                {(profile.target_audience || []).length === 0 ? (
                  <p className="mt-3 text-sm text-slate-400">
                    No audience detected
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">

                    {profile.target_audience.map(
                      (audience, index) => (
                        <li
                          key={`${audience}-${index}`}
                          className="text-sm text-slate-700"
                        >
                          • {audience}
                        </li>
                      )
                    )}

                  </ul>
                )}

              </div>

            </div>

          </section>
        )}

        {/* STATS */}

        <div className="grid gap-4 md:grid-cols-3">

          {/* Memories */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Stored Memories
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">

                <Brain
                  size={19}
                  className="text-violet-600"
                />

              </div>

            </div>

            <p className="mt-4 text-3xl font-bold text-slate-900">
              {memories.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Persistent Hindsight memories
            </p>

          </div>

          {/* Memory System */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Memory System
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">

                <Database
                  size={19}
                  className="text-emerald-600"
                />

              </div>

            </div>

            <p className="mt-4 text-xl font-bold text-emerald-600">
              Hindsight
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Recall + Retain enabled
            </p>

          </div>

          {/* Agent Status */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <p className="text-sm text-slate-500">
                Agent Status
              </p>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">

                <Activity
                  size={19}
                  className="text-blue-600"
                />

              </div>

            </div>

            <p className="mt-4 text-xl font-bold text-emerald-600">
              Active
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Gemini + Hindsight connected
            </p>

          </div>

        </div>

        {/* HOW IT WORKS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6">

            <h3 className="font-bold text-slate-900">
              How Social Memory Agent Works
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Every interaction improves the agent's context.
            </p>

          </div>

          <div className="grid gap-4 md:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">

              <Brain
                size={20}
                className="mb-3 text-violet-600"
              />

              <p className="font-semibold text-slate-800">
                01. Recall
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Hindsight retrieves relevant memories.
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <Sparkles
                size={20}
                className="mb-3 text-violet-600"
              />

              <p className="font-semibold text-slate-800">
                02. Generate
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Gemini creates personalized content.
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <Database
                size={20}
                className="mb-3 text-violet-600"
              />

              <p className="font-semibold text-slate-800">
                03. Retain
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                New interactions are stored as memories.
              </p>

            </div>

            <div className="rounded-xl bg-slate-50 p-4">

              <Zap
                size={20}
                className="mb-3 text-violet-600"
              />

              <p className="font-semibold text-slate-800">
                04. Improve
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Future posts become more personalized.
              </p>

            </div>

          </div>

        </div>

      </div>
    )
  }

  // -----------------------------------------
  // CREATE POST PAGE
  // -----------------------------------------

  const renderCreatePost = () => {
    return (
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">

        {/* Left panel */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles size={20} />
            </div>

            <div>

              <h3 className="font-bold">
                Create Content
              </h3>

              <p className="text-xs text-slate-400">
                Personalized using memory
              </p>

            </div>

          </div>

          {/* Topic */}

          <label className="mb-2 block text-sm font-semibold">
            What do you want to post about?
          </label>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. AI Agents, RAG, cybersecurity..."
            className="mb-5 min-h-32 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
          />

          {/* Platform */}

          <label className="mb-2 block text-sm font-semibold">
            Platform
          </label>

          <div className="relative mb-6">

            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            >
              <option>LinkedIn</option>
              <option>Twitter / X</option>
              <option>Instagram</option>
            </select>

            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

          </div>

          {/* Generate */}

          <button
            onClick={generatePost}
            disabled={loading || !topic.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {loading ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />

                Generating...
              </>
            ) : (
              <>
                <Sparkles size={17} />

                Generate Personalized Post
              </>
            )}

          </button>

          {/* Memory indicator */}

          <div className="mt-5 rounded-xl bg-violet-50 p-4">

            <div className="flex items-start gap-3">

              <Brain
                size={18}
                className="mt-0.5 text-violet-600"
              />

              <div>

                <p className="text-sm font-semibold text-violet-900">
                  Memory is active
                </p>

                <p className="mt-1 text-xs leading-5 text-violet-700">
                  Your agent recalls relevant preferences,
                  audience information, and previous content
                  before generating the post.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* Right panel */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

            <div>

              <h3 className="font-bold">
                Generated Post
              </h3>

              <p className="text-xs text-slate-400">
                Personalized using Hindsight memory
              </p>

            </div>

            {post && (
              <button
                onClick={copyPost}
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >

                {copied ? (
                  <>
                    <Check size={15} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    Copy
                  </>
                )}

              </button>
            )}

          </div>

          <div className="min-h-[480px] p-6">

            {/* Empty */}

            {!post && !loading && (
              <div className="flex min-h-[430px] flex-col items-center justify-center text-center">

                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">

                  <PenSquare
                    size={26}
                    className="text-slate-400"
                  />

                </div>

                <h4 className="font-semibold text-slate-700">
                  Your personalized post will appear here
                </h4>

                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                  Enter a topic and let the agent use its
                  persistent memory to create content tailored
                  to your audience.
                </p>

              </div>
            )}

            {/* Loading */}

            {loading && (
              <div className="flex min-h-[430px] flex-col items-center justify-center">

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100">

                  <Sparkles
                    size={24}
                    className="animate-pulse text-violet-600"
                  />

                </div>

                <p className="font-semibold">
                  Recalling memories...
                </p>

                <p className="mt-2 text-sm text-slate-400">
                  Personalizing your content with Hindsight
                </p>

              </div>
            )}

            {/* Generated post */}

            {post && !loading && (
              <div>

                <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                  {post}
                </div>

                {/* Memories used */}

                <div className="mt-8 border-t border-slate-100 pt-5">

                  <div className="mb-3 flex items-center justify-between">

                    <div className="flex items-center gap-2">

                      <Brain
                        size={16}
                        className="text-violet-600"
                      />

                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Hindsight Memories Used
                      </span>

                    </div>

                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700">
                      Personalized
                    </span>

                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-4">

                    <p className="whitespace-pre-wrap text-xs leading-5 text-slate-500">
                      {memoriesUsed || "No specific memories returned."}
                    </p>

                  </div>

                </div>

              </div>
            )}

          </div>

        </section>

      </div>
    )
  }

  // -----------------------------------------
  // MEMORY PAGE
  // -----------------------------------------

  const renderMemory = () => {
    return (
      <div className="space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <h3 className="text-2xl font-bold text-slate-900">
              Agent Memory
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Persistent memories stored by Hindsight
            </p>

          </div>

          <button
            onClick={loadMemories}
            disabled={memoryLoading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={memoryLoading ? "animate-spin" : ""}
            />

            Refresh

          </button>

        </div>

        {/* Statistics */}

        <div className="grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Stored Memories
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {memories.length}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Retrieved from Hindsight
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Memory System
            </p>

            <p className="mt-2 text-lg font-semibold text-violet-600">
              Hindsight
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Persistent agent memory
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <p className="text-sm text-slate-500">
              Status
            </p>

            <p className="mt-2 text-lg font-semibold text-emerald-600">
              Persistent
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Recall + Retain active
            </p>

          </div>

        </div>

        {/* Timeline */}

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 p-5">

            <h2 className="font-semibold text-slate-900">
              Memory Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Information the agent has learned from previous interactions.
            </p>

          </div>

          <div className="divide-y divide-slate-100">

            {memoryLoading ? (
              <div className="p-10 text-center">

                <RefreshCw
                  size={22}
                  className="mx-auto animate-spin text-violet-600"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading memories...
                </p>

              </div>
            ) : memories.length === 0 ? (
              <div className="p-10 text-center">

                <Brain
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No memories found
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Import a profile or generate a post to create persistent memories.
                </p>

              </div>
            ) : (
              memories.map((memory, index) => (
                <div
                  key={`${index}-${memory.text}`}
                  className="flex gap-4 p-5 transition hover:bg-slate-50"
                >

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100">

                    <Brain
                      size={18}
                      className="text-violet-600"
                    />

                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="text-sm leading-6 text-slate-700">
                      {memory.text}
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                        Persistent Memory
                      </span>

                      <span className="text-[10px] text-slate-400">
                        #{index + 1}
                      </span>

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

      </div>
    )
  }

  // -----------------------------------------
  // INSIGHTS PAGE
  // -----------------------------------------

  const renderInsights = () => {

    const audience =
      profile?.target_audience?.length
        ? profile.target_audience.join(", ")
        : "AI engineers and computer science students"

    const writingStyle =
      profile?.writing_style?.length
        ? profile.writing_style.join(", ")
        : "Concise technical posts, practical examples, and minimal emojis"

    const topics =
      profile?.content_topics?.length
        ? profile.content_topics.join(", ")
        : "No profile topics detected yet"

    return (
      <div className="space-y-6">

        <div>

          <h3 className="text-2xl font-bold text-slate-900">
            Insights
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Patterns learned from your agent's persistent memory.
          </p>

        </div>

        <div className="grid gap-4 md:grid-cols-2">

          {/* Audience */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">

              <Users
                size={19}
                className="text-violet-600"
              />

            </div>

            <h4 className="mt-4 font-bold text-slate-900">
              Audience
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {audience}
            </p>

          </div>

          {/* Writing Style */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">

              <PenSquare
                size={19}
                className="text-blue-600"
              />

            </div>

            <h4 className="mt-4 font-bold text-slate-900">
              Writing Style
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {writingStyle}
            </p>

          </div>

          {/* Topics */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">

              <Sparkles
                size={19}
                className="text-purple-600"
              />

            </div>

            <h4 className="mt-4 font-bold text-slate-900">
              Content Topics
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {topics}
            </p>

          </div>

          {/* Profile */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">

              <UserCircle
                size={19}
                className="text-emerald-600"
              />

            </div>

            <h4 className="mt-4 font-bold text-slate-900">
              Professional Profile
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {profile
                ? `${profile.name || "Profile"} is connected to the agent's persistent memory.`
                : "Import a professional profile to personalize the agent."}
            </p>

          </div>

        </div>

        {/* Persistent Memory */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">

              <Brain
                size={19}
                className="text-emerald-600"
              />

            </div>

            <div>

              <h4 className="font-bold text-slate-900">
                Persistent Memory
              </h4>

              <p className="text-xs text-slate-400">
                {memories.length} memories currently available
              </p>

            </div>

          </div>

          <p className="mt-4 text-sm leading-6 text-slate-500">
            The agent can recall information from previous
            interactions and use that context when generating
            new social media content.
          </p>

        </div>

      </div>
    )
  }

  // -----------------------------------------
  // RENDER ACTIVE PAGE
  // -----------------------------------------

  const renderPage = () => {

    if (activePage === "Dashboard") {
      return renderDashboard()
    }

    if (activePage === "Create Post") {
      return renderCreatePost()
    }

    if (activePage === "Memory") {
      return renderMemory()
    }

    if (activePage === "Insights") {
      return renderInsights()
    }

    return renderDashboard()
  }

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-900">

      {/* SIDEBAR */}

      <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">

        {/* Logo */}

        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">

            <Brain size={22} />

          </div>

          <div>

            <h1 className="font-bold tracking-tight">
              Social Memory
            </h1>

            <p className="text-xs text-slate-400">
              AI Engagement Agent
            </p>

          </div>

        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">

          <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {menuItems.map((item) => {

            const Icon = item.icon
            const active = activePage === item.name

            return (
              <button
                key={item.name}
                onClick={() => setActivePage(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >

                <Icon size={18} />

                {item.name}

              </button>
            )
          })}

          {/* AI TOOLS */}

          <div className="mt-5 border-t border-slate-100 pt-5">

            <p className="px-3 pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Tools
            </p>

            <button
              onClick={openSmartRAG}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
            >

              <BookOpen size={18} />

              <span className="flex-1 text-left">
                SmartRAG
              </span>

              <span className="text-[10px] font-medium text-slate-400">
                Open
              </span>

            </button>

          </div>

        </nav>

        {/* Bottom */}

        <div className="border-t border-slate-100 p-4">

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
              S
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-sm font-semibold">
                Social Agent
              </p>

              <p className="truncate text-xs text-slate-400">
                Memory enabled
              </p>

            </div>

            <Settings
              size={16}
              className="text-slate-400"
            />

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <main className="ml-64 min-h-screen">

        {/* HEADER */}

        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">

          <div>

            <h2 className="text-xl font-bold">
              {activePage}
            </h2>

            <p className="text-sm text-slate-400">
              Create content that gets smarter with every interaction.
            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              Hindsight Connected

            </div>

          </div>

        </header>

        {/* CONTENT */}

        <div className="mx-auto max-w-7xl px-8 py-8">

          {renderPage()}

        </div>

      </main>

    </div>
  )
}

export default App
