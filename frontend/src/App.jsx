
import { useEffect, useState } from "react";
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
  Trophy,
  Star,
  CircleCheck,
  Target,
} from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const SMART_RAG_URL = "http://localhost:8501";

/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const rawText = await response.text();

  let data = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { detail: rawText };
    }
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        message = data.detail
          .map((item) => item?.msg || JSON.stringify(item))
          .join(", ");
      } else {
        message = JSON.stringify(data.detail);
      }
    }

    throw new Error(message);
  }

  if (data === null) {
    throw new Error("The server returned an empty response.");
  }

  return data;
}

/* =========================================================
   SMALL UI HELPERS
========================================================= */

function getGradeStyle(grade) {
  switch (grade) {
    case "A":
      return {
        badge: "bg-green-100 text-green-700 border-green-200",
        ring: "border-green-200",
      };

    case "B":
      return {
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        ring: "border-blue-200",
      };

    case "C":
      return {
        badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
        ring: "border-yellow-200",
      };

    case "D":
      return {
        badge: "bg-red-100 text-red-700 border-red-200",
        ring: "border-red-200",
      };

    default:
      return {
        badge: "bg-gray-100 text-gray-600 border-gray-200",
        ring: "border-gray-200",
      };
  }
}

function getPostContent(post) {
  if (!post) return "";

  if (typeof post === "string") {
    return post;
  }

  return (
    post.content ||
    post.post ||
    post.text ||
    post.generated_post ||
    ""
  );
}

function getPostScore(post) {
  if (!post) return null;

  const score = Number(
    post.score ??
      post.total_score ??
      post.evaluation_score ??
      post.rating
  );

  return Number.isFinite(score) ? score : null;
}

function getPostGrade(post) {
  if (!post) return "";

  return (
    post.grade ||
    post.evaluation?.grade ||
    post.evaluation?.label ||
    ""
  );
}

function getPostReason(post) {
  if (!post) return "";

  if (typeof post.reason === "string") {
    return post.reason;
  }

  if (typeof post.feedback === "string") {
    return post.feedback;
  }

  if (typeof post.evaluation?.feedback === "string") {
    return post.evaluation.feedback;
  }

  return "";
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  /* -------------------------------------------------------
     GENERATION STATE
  ------------------------------------------------------- */

  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("LinkedIn");

  const [post, setPost] = useState("");
  const [posts, setPosts] = useState([]);
  const [bestPost, setBestPost] = useState(null);

  const [memoriesUsed, setMemoriesUsed] = useState("");
  const [modelUsed, setModelUsed] = useState("");
  const [evaluatorModel, setEvaluatorModel] = useState("");
  const [memorySaved, setMemorySaved] = useState(false);

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generationError, setGenerationError] = useState("");

  /* -------------------------------------------------------
     MEMORY STATE
  ------------------------------------------------------- */

  const [memories, setMemories] = useState([]);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryError, setMemoryError] = useState("");

  /* -------------------------------------------------------
     PROFILE STATE
  ------------------------------------------------------- */

  const [profile, setProfile] = useState(null);
  const [profileSource, setProfileSource] = useState("LinkedIn");
  const [profileUrl, setProfileUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  /* -------------------------------------------------------
     DASHBOARD
  ------------------------------------------------------- */

  const [dashboard, setDashboard] = useState(null);

  /* =========================================================
     LOAD MEMORIES
  ========================================================= */

  const loadMemories = async () => {
    setMemoryLoading(true);
    setMemoryError("");

    try {
      const data = await apiRequest("/memories");

      const memoryList = Array.isArray(data)
        ? data
        : data?.memories || [];

      setMemories(memoryList);
    } catch (error) {
      console.error("Memory loading error:", error);
      setMemoryError(error.message);
      setMemories([]);
    } finally {
      setMemoryLoading(false);
    }
  };

  /* =========================================================
     LOAD DASHBOARD
  ========================================================= */

  const loadDashboard = async () => {
    try {
      const data = await apiRequest("/dashboard");

      setDashboard(data || null);

      if (data?.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  };

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadMemories();
    loadDashboard();
  }, []);

  /* =========================================================
     GENERATE POST
  ========================================================= */

  const generatePost = async () => {
    const cleanTopic = topic.trim();

    if (!cleanTopic) {
      setGenerationError("Please enter a topic first.");
      return;
    }

    setLoading(true);
    setGenerationError("");
    setPost("");
    setPosts([]);
    setBestPost(null);
    setMemoriesUsed("");
    setModelUsed("");
    setEvaluatorModel("");
    setMemorySaved(false);
    setCopied(false);

    try {
      console.log("Sending request to backend...");

      const data = await apiRequest("/generate", {
        method: "POST",
        body: JSON.stringify({
          topic: cleanTopic,
          platform,
        }),
      });

      console.log("Generate response:", data);

      if (!data) {
        throw new Error("Backend returned no data.");
      }

      /* -----------------------------------------------------
         NEW BACKEND RESPONSE

         {
           topic,
           platform,
           model_used,
           evaluator_model,
           total_candidates,
           posts: [...],
           best_post: {...},
           memory_saved
         }
      ----------------------------------------------------- */

      const returnedPosts = Array.isArray(data.posts)
        ? data.posts
        : [];

      const returnedBestPost = data.best_post || null;

      const bestContent = getPostContent(returnedBestPost);

      if (!returnedBestPost || !bestContent) {
        throw new Error(
          data.detail ||
            data.message ||
            "Backend did not return a valid best post."
        );
      }

      setPosts(returnedPosts);
      setBestPost(returnedBestPost);
      setPost(bestContent);

      setModelUsed(data.model_used || "");
      setEvaluatorModel(data.evaluator_model || "");
      setMemorySaved(Boolean(data.memory_saved));

      /*
       * The current backend does not return memories_used
       * directly, so show a useful status instead.
       */
      setMemoriesUsed(
        data.total_candidates
          ? `${data.total_candidates} personalized candidates were generated and evaluated using Hindsight memory.`
          : "Hindsight memory was used during generation."
      );

      /* Refresh memory without breaking the generated result. */
      await Promise.allSettled([
        loadMemories(),
        loadDashboard(),
      ]);
    } catch (error) {
      console.error("Generation error:", error);

      setGenerationError(
        error?.message || "Unable to generate the posts."
      );

      setPost("");
      setPosts([]);
      setBestPost(null);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     COPY BEST POST
  ========================================================= */

  const copyPost = async () => {
    if (!post) return;

    try {
      await navigator.clipboard.writeText(post);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  /* =========================================================
     PROFILE ANALYSIS
  ========================================================= */

  const analyzeProfile = async () => {
    if (!profileUrl.trim() && !profileText.trim()) {
      setProfileMessage(
        "Please provide a profile URL or paste profile text."
      );
      return;
    }

    setProfileLoading(true);
    setProfileMessage("");

    try {
      const data = await apiRequest("/profile/analyze", {
        method: "POST",
        body: JSON.stringify({
          source: profileSource,
          profile_url: profileUrl.trim(),
          profile_text: profileText.trim(),
        }),
      });

      setProfile(data?.profile || data || null);

      setProfileMessage(
        data?.message ||
          "Profile analyzed and stored successfully."
      );

      await Promise.allSettled([
        loadMemories(),
        loadDashboard(),
      ]);
    } catch (error) {
      console.error("Profile analysis error:", error);

      setProfileMessage(
        error?.message || "Unable to analyze the profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  /* =========================================================
     SMART RAG
  ========================================================= */

  const openSmartRAG = () => {
    window.open(
      SMART_RAG_URL,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navigation = [
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
  ];

  /* =========================================================
     DASHBOARD
  ========================================================= */

  const renderDashboard = () => (
    <div className="space-y-8">

      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700">
          <Sparkles className="h-4 w-4" />
          AI-powered social intelligence
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#3F3740]">
          Social Memory Agent
        </h1>

        <p className="mt-2 max-w-2xl text-[#8A7D87]">
          Create personalized social media content using
          persistent AI memory, Gemma 4, and intelligent
          post evaluation.
        </p>
      </div>

      {/* PROFILE MEMORY */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[#F5EAF5] p-3">
            <UserCircle className="h-6 w-6 text-[#B978B9]" />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-[#3F3740]">
              Profile Memory
            </h2>

            <p className="text-sm text-[#8A7D87]">
              Teach the agent about your professional profile.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6F626D]">
              Source
            </label>

            <select
              value={profileSource}
              onChange={(e) =>
                setProfileSource(e.target.value)
              }
              className="w-full rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-3 text-[#3F3740] outline-none transition focus:border-[#C98BC9] focus:ring-2 focus:ring-[#E8B4C8]/30"
            >
              <option>LinkedIn</option>
              <option>GitHub</option>
              <option>Naukri</option>
              <option>Indeed</option>
              <option>Portfolio</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#6F626D]">
              Profile URL
            </label>

            <input
              type="text"
              value={profileUrl}
              onChange={(e) =>
                setProfileUrl(e.target.value)
              }
              placeholder="https://..."
              className="w-full rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-3 text-[#3F3740] outline-none placeholder:text-[#B7ABB4] transition focus:border-[#C98BC9] focus:ring-2 focus:ring-[#E8B4C8]/30"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-[#6F626D]">
            Profile Information
          </label>

          <textarea
            value={profileText}
            onChange={(e) =>
              setProfileText(e.target.value)
            }
            rows={5}
            placeholder="Paste your profile, skills, projects, interests..."
            className="w-full resize-none rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-3 text-[#3F3740] outline-none placeholder:text-[#B7ABB4] transition focus:border-[#C98BC9] focus:ring-2 focus:ring-[#E8B4C8]/30"
          />
        </div>

        <button
          onClick={analyzeProfile}
          disabled={profileLoading}
          className="mt-4 flex items-center gap-2 rounded-xl bg-[#C98BC9] px-5 py-3 font-semibold text-white transition hover:bg-[#B978B9] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {profileLoading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-4 w-4" />
              Analyze & Remember
            </>
          )}
        </button>

        {profileMessage && (
          <p className="mt-4 rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] p-3 text-sm text-[#6F626D]">
            {profileMessage}
          </p>
        )}
      </div>

      {/* STATS */}

      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-5 shadow-sm">
          <Database className="mb-3 h-6 w-6 text-[#B978B9]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            {memories.length}
          </p>

          <p className="text-sm text-[#8A7D87]">
            Retrieved Memories
          </p>
        </div>

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-5 shadow-sm">
          <Activity className="mb-3 h-6 w-6 text-[#C98BC9]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            Active
          </p>

          <p className="text-sm text-[#8A7D87]">
            Agent Status
          </p>
        </div>

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-5 shadow-sm">
          <Zap className="mb-3 h-6 w-6 text-[#D5A94D]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            Gemma 4
          </p>

          <p className="text-sm text-[#8A7D87]">
            Generation Model
          </p>
        </div>
      </div>

      {/* HOW IT WORKS */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-xl font-semibold text-[#3F3740]">
          How It Works
        </h2>

        <div className="grid gap-6 md:grid-cols-5">

          {[
            ["1", "Your Profile", "Professional identity"],
            ["2", "Hindsight", "Persistent memory"],
            ["3", "Gemma 4", "5 post candidates"],
            ["4", "Evaluation", "A/B/C/D scoring"],
            ["5", "Best Post", "Highest-scoring result"],
          ].map(([number, title, description]) => (
            <div key={number} className="text-center">

              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#C98BC9] font-bold text-white">
                {number}
              </div>

              <h3 className="font-semibold text-[#3F3740]">
                {title}
              </h3>

              <p className="mt-1 text-sm text-[#8A7D87]">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* =========================================================
     CREATE POST
  ========================================================= */

  const renderCreatePost = () => (
    <div className="mx-auto max-w-6xl space-y-8">

      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8B4C8] bg-[#F5EAF5] px-3 py-1.5 text-sm font-medium text-[#9C5F96]">
          <Sparkles className="h-4 w-4" />
          Gemma 4 + Hindsight
        </div>

        <h1 className="text-3xl font-bold text-[#3F3740]">
          Create Post
        </h1>

        <p className="mt-2 text-[#8A7D87]">
          Generate five personalized candidates and let the
          AI evaluator select the strongest one.
        </p>
      </div>

      {/* INPUT */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <div className="grid gap-5 md:grid-cols-2">

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-[#6F626D]">
              Topic
            </label>

            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loading) {
                  generatePost();
                }
              }}
              placeholder="e.g. AI Agents, Machine Learning, Hackathon..."
              className="w-full rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-4 text-[#3F3740] outline-none placeholder:text-[#B7ABB4] transition focus:border-[#C98BC9] focus:ring-2 focus:ring-[#E8B4C8]/30"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#6F626D]">
              Platform
            </label>

            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-4 text-[#3F3740] outline-none transition focus:border-[#C98BC9] focus:ring-2 focus:ring-[#E8B4C8]/30"
            >
              <option>LinkedIn</option>
              <option>Twitter</option>
              <option>Instagram</option>
              <option>Facebook</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generatePost}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C98BC9] px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-[#B978B9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Generating & Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate 5 Posts
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ERROR */}

      {generationError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="font-semibold text-red-700">
            Unable to generate the posts
          </p>

          <p className="mt-2 text-sm text-red-600">
            {generationError}
          </p>
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="rounded-3xl border border-[#EDE3E8] bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EAF5]">
            <RefreshCw className="h-8 w-8 animate-spin text-[#B978B9]" />
          </div>

          <h3 className="mt-5 text-lg font-semibold text-[#3F3740]">
            Your AI agent is working...
          </h3>

          <p className="mt-2 text-sm text-[#8A7D87]">
            Recalling memories → generating 5 candidates →
            evaluating → selecting the best post
          </p>
        </div>
      )}

      {/* BEST POST */}

      {!loading && bestPost && (
        <div className="overflow-hidden rounded-3xl border border-[#E8B4C8] bg-white shadow-md">

          <div className="border-b border-[#EDE3E8] bg-gradient-to-r from-[#F5EAF5] to-[#FFF3D6] p-6">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-[#C98BC9] p-3 text-white">
                  <Trophy className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#9C5F96]">
                    AI Selected Winner
                  </p>

                  <h2 className="text-xl font-bold text-[#3F3740]">
                    Best Personalized Post
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">

                {getPostGrade(bestPost) && (
                  <span
                    className={`rounded-full border px-4 py-2 text-sm font-bold ${
                      getGradeStyle(getPostGrade(bestPost)).badge
                    }`}
                  >
                    Grade {getPostGrade(bestPost)}
                  </span>
                )}

                {getPostScore(bestPost) !== null && (
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#3F3740] shadow-sm">
                    {getPostScore(bestPost)}/100
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">

            <div className="flex items-center justify-between">

              <div>
                <h3 className="font-semibold text-[#3F3740]">
                  Generated Post
                </h3>

                <p className="mt-1 text-sm text-[#8A7D87]">
                  Highest-scoring candidate from the AI evaluation.
                </p>
              </div>

              <button
                onClick={copyPost}
                className="flex items-center gap-2 rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-2 text-sm font-medium text-[#6F626D] transition hover:border-[#C98BC9] hover:text-[#9C5F96]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-[#EDE3E8] bg-[#FFFDF7] p-6 text-[15px] leading-7 text-[#3F3740]">
              {post}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">

              <div className="rounded-xl bg-[#F5EAF5] p-4">
                <p className="text-xs font-medium text-[#9C5F96]">
                  Generation Model
                </p>
                <p className="mt-1 text-sm font-semibold text-[#3F3740]">
                  {modelUsed || "Gemma 4"}
                </p>
              </div>

              <div className="rounded-xl bg-[#FFF3D6] p-4">
                <p className="text-xs font-medium text-[#9A7835]">
                  Evaluator
                </p>
                <p className="mt-1 text-sm font-semibold text-[#3F3740]">
                  {evaluatorModel || "Gemma 4"}
                </p>
              </div>

              <div className="rounded-xl bg-[#F5EAF5] p-4">
                <p className="text-xs font-medium text-[#9C5F96]">
                  Memory
                </p>
                <p className="mt-1 text-sm font-semibold text-[#3F3740]">
                  {memorySaved ? "Saved to Hindsight" : "Used"}
                </p>
              </div>
            </div>

            {getPostReason(bestPost) && (
              <div className="mt-5 rounded-xl border border-[#EDE3E8] bg-white p-4">
                <p className="mb-1 text-sm font-semibold text-[#3F3740]">
                  Evaluation Feedback
                </p>

                <p className="text-sm leading-6 text-[#8A7D87]">
                  {getPostReason(bestPost)}
                </p>
              </div>
            )}

            {memoriesUsed && (
              <div className="mt-5 rounded-xl border border-[#E8B4C8] bg-[#F5EAF5] p-4">
                <p className="mb-1 text-sm font-semibold text-[#9C5F96]">
                  Hindsight Memory
                </p>

                <p className="text-sm leading-6 text-[#6F626D]">
                  {memoriesUsed}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALL CANDIDATES */}

      {!loading && posts.length > 0 && (
        <div className="space-y-5">

          <div>
            <h2 className="text-xl font-bold text-[#3F3740]">
              Candidate Posts
            </h2>

            <p className="mt-1 text-sm text-[#8A7D87]">
              All generated candidates ranked by the AI evaluator.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">

            {posts.map((candidate, index) => {
              const content = getPostContent(candidate);
              const grade = getPostGrade(candidate);
              const score = getPostScore(candidate);

              const isWinner =
                bestPost &&
                content === getPostContent(bestPost);

              const gradeStyle = getGradeStyle(grade);

              return (
                <div
                  key={candidate?.id || candidate?.index || index}
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                    isWinner
                      ? "border-[#C98BC9] ring-2 ring-[#E8B4C8]/30"
                      : "border-[#EDE3E8] hover:border-[#E8B4C8]"
                  }`}
                >

                  <div className="mb-4 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F5EAF5] text-sm font-bold text-[#9C5F96]">
                        #{index + 1}
                      </div>

                      {isWinner && (
                        <span className="flex items-center gap-1 text-xs font-bold text-[#9C5F96]">
                          <Trophy className="h-3.5 w-3.5" />
                          WINNER
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">

                      {grade && (
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${gradeStyle.badge}`}
                        >
                          {grade}
                        </span>
                      )}

                      {score !== null && (
                        <span className="flex items-center gap-1 rounded-full bg-[#FFF3D6] px-3 py-1 text-xs font-bold text-[#8D7135]">
                          <Star className="h-3 w-3" />
                          {score}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap rounded-xl bg-[#FFFDF7] p-4 text-sm leading-6 text-[#4D444D]">
                    {content || "No post content returned."}
                  </div>

                  {getPostReason(candidate) && (
                    <div className="mt-4 border-t border-[#EDE3E8] pt-4">
                      <p className="text-xs font-semibold text-[#6F626D]">
                        Evaluation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#8A7D87]">
                        {getPostReason(candidate)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}

      {!loading &&
        !bestPost &&
        !generationError && (
          <div className="rounded-3xl border border-dashed border-[#E8DCE3] bg-white p-14 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EAF5]">
              <Sparkles className="h-8 w-8 text-[#C98BC9]" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-[#3F3740]">
              Ready to create
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-[#8A7D87]">
              Enter a topic above. Your agent will generate
              five different posts, evaluate them, and select
              the strongest one.
            </p>
          </div>
        )}
    </div>
  );

  /* =========================================================
     MEMORY PAGE
  ========================================================= */

  const renderMemory = () => (
    <div className="space-y-8">

      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8B4C8] bg-[#F5EAF5] px-3 py-1.5 text-sm font-medium text-[#9C5F96]">
          <Brain className="h-4 w-4" />
          Hindsight
        </div>

        <h1 className="text-3xl font-bold text-[#3F3740]">
          Memory
        </h1>

        <p className="mt-2 text-[#8A7D87]">
          Persistent memories retrieved from your AI agent.
        </p>
      </div>

      {memoryError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {memoryError}
        </div>
      )}

      {memoryLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="h-8 w-8 animate-spin text-[#C98BC9]" />
        </div>
      ) : memories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#E8DCE3] bg-white p-14 text-center shadow-sm">

          <Database className="mx-auto h-10 w-10 text-[#C8BBC5]" />

          <p className="mt-4 text-[#8A7D87]">
            No memories available yet.
          </p>

          <p className="mt-2 text-sm text-[#B1A4AE]">
            Analyze your profile or generate a post to build memory.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {memories.map((memory, index) => {
            const content =
              typeof memory === "string"
                ? memory
                : memory?.content ||
                  memory?.text ||
                  memory?.memory ||
                  JSON.stringify(memory);

            return (
              <div
                key={memory?.id || index}
                className="rounded-2xl border border-[#EDE3E8] bg-white p-5 shadow-sm"
              >
                <div className="flex gap-4">

                  <div className="mt-1 rounded-lg bg-[#F5EAF5] p-2">
                    <Brain className="h-5 w-5 text-[#B978B9]" />
                  </div>

                  <p className="whitespace-pre-wrap leading-7 text-[#5B515A]">
                    {content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* =========================================================
     INSIGHTS
  ========================================================= */

  const renderInsights = () => (
    <div className="space-y-8">

      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#E8B4C8] bg-[#F5EAF5] px-3 py-1.5 text-sm font-medium text-[#9C5F96]">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </div>

        <h1 className="text-3xl font-bold text-[#3F3740]">
          Insights
        </h1>

        <p className="mt-2 text-[#8A7D87]">
          Understand your AI-powered content personalization system.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-6 shadow-sm">
          <Users className="mb-4 h-7 w-7 text-[#B978B9]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            {memories.length}
          </p>

          <p className="mt-1 text-[#8A7D87]">
            Retrieved memories
          </p>
        </div>

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-6 shadow-sm">
          <Sparkles className="mb-4 h-7 w-7 text-[#C98BC9]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            5
          </p>

          <p className="mt-1 text-[#8A7D87]">
            Candidate posts per generation
          </p>
        </div>

        <div className="rounded-2xl border border-[#EDE3E8] bg-white p-6 shadow-sm">
          <Target className="mb-4 h-7 w-7 text-[#D5A94D]" />

          <p className="text-3xl font-bold text-[#3F3740]">
            A–D
          </p>

          <p className="mt-1 text-[#8A7D87]">
            AI evaluation grades
          </p>
        </div>
      </div>

      {/* EVALUATION PIPELINE */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <h2 className="mb-6 text-xl font-semibold text-[#3F3740]">
          Evaluation Pipeline
        </h2>

        <div className="grid gap-4 md:grid-cols-4">

          {[
            {
              icon: Brain,
              title: "Recall",
              description: "Hindsight retrieves relevant user memories.",
            },
            {
              icon: Sparkles,
              title: "Generate",
              description: "Gemma 4 creates five distinct candidates.",
            },
            {
              icon: BarChart3,
              title: "Evaluate",
              description: "Each candidate receives a score and grade.",
            },
            {
              icon: Trophy,
              title: "Select",
              description: "The highest-scoring post becomes the winner.",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-[#EDE3E8] bg-[#FFFDF7] p-5"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#F5EAF5] p-3">
                  <Icon className="h-5 w-5 text-[#B978B9]" />
                </div>

                <h3 className="font-semibold text-[#3F3740]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#8A7D87]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SCORING */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-xl font-semibold text-[#3F3740]">
          Evaluation Criteria
        </h2>

        <div className="grid gap-3 md:grid-cols-2">

          {[
            ["Relevance", "20 points"],
            ["Personalization", "20 points"],
            ["Technical / Practical Value", "15 points"],
            ["Engagement", "15 points"],
            ["Clarity", "10 points"],
            ["Authenticity", "10 points"],
            ["Platform Suitability", "10 points"],
          ].map(([criterion, score]) => (
            <div
              key={criterion}
              className="flex items-center justify-between rounded-xl bg-[#FFFDF7] px-4 py-3"
            >
              <span className="text-sm font-medium text-[#5B515A]">
                {criterion}
              </span>

              <span className="text-sm font-bold text-[#9C5F96]">
                {score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CONNECTED TOOLS */}

      <div className="rounded-3xl border border-[#EDE3E8] bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-xl font-semibold text-[#3F3740]">
          Connected Tools
        </h2>

        <button
          onClick={openSmartRAG}
          className="flex items-center gap-3 rounded-xl border border-[#EDE3E8] bg-[#FFFDF7] px-5 py-4 text-[#5B515A] transition hover:border-[#C98BC9] hover:text-[#9C5F96]"
        >
          <Link className="h-5 w-5" />
          <span>Open SmartRAG</span>
        </button>
      </div>
    </div>
  );

  /* =========================================================
     PAGE ROUTER
  ========================================================= */

  const renderPage = () => {
    switch (activePage) {
      case "Create Post":
        return renderCreatePost();

      case "Memory":
        return renderMemory();

      case "Insights":
        return renderInsights();

      case "Dashboard":
      default:
        return renderDashboard();
    }
  };

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-[#3F3740]">

      <div className="flex min-h-screen">

        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <aside className="hidden w-64 border-r border-[#EDE3E8] bg-white lg:block">

          <div className="flex h-full flex-col">

            {/* LOGO */}

            <div className="border-b border-[#EDE3E8] p-6">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-[#C98BC9] p-2.5 shadow-sm">
                  <Brain className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h1 className="font-bold text-[#3F3740]">
                    Social Memory
                  </h1>

                  <p className="text-xs text-[#9B8E99]">
                    AI Agent
                  </p>
                </div>
              </div>
            </div>

            {/* NAVIGATION */}

            <nav className="flex-1 space-y-2 p-4">

              {navigation.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => setActivePage(item.name)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      active
                        ? "bg-[#F5EAF5] font-semibold text-[#9C5F96]"
                        : "text-[#817580] hover:bg-[#FFFDF7] hover:text-[#3F3740]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />

                    <span>{item.name}</span>

                    {item.name === "Create Post" && (
                      <span className="ml-auto rounded-full bg-[#E8B4C8] px-2 py-0.5 text-[10px] font-bold text-white">
                        AI
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* BOTTOM */}

            <div className="border-t border-[#EDE3E8] p-4">

              <button
                onClick={openSmartRAG}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[#817580] transition hover:bg-[#FFFDF7] hover:text-[#3F3740]"
              >
                <BookOpen className="h-5 w-5" />
                <span>SmartRAG</span>
              </button>

              <button className="mt-2 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[#817580] transition hover:bg-[#FFFDF7] hover:text-[#3F3740]"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="flex-1">

          {/* HEADER */}

          <header className="flex h-20 items-center justify-between border-b border-[#EDE3E8] bg-white px-6 lg:px-10">

            <div>
              <p className="text-sm text-[#8A7D87]">
                AI-powered social media personalization
              </p>

              <p className="mt-0.5 text-xs text-[#B1A4AE]">
                Hindsight memory • Gemma 4 • Intelligent evaluation
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-2 rounded-full border border-[#EDE3E8] bg-[#FFFDF7] px-4 py-2">

                <span className="h-2 w-2 rounded-full bg-green-400" />

                <span className="text-sm font-medium text-[#5B515A]">
                  Agent Online
                </span>
              </div>

              <ChevronDown className="h-4 w-4 text-[#9B8E99]" />
            </div>
          </header>

          {/* CONTENT */}

          <div className="p-6 lg:p-10">
            {renderPage()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
