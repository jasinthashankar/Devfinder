import { useState, useEffect } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";
import { getRecommendations } from "../services/dataService";
import api from "../services/api";
import { useToast } from "../context/ToastContext";
import RepoCard from "../components/RepoCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

// Default suggested skills — these always show (user can type anything else)
const BASE_SKILLS = [
  "Python", "React", "FastAPI", "Machine Learning", "Flask",
  "Node.js", "SQL", "RAG", "LangChain", "TypeScript", "Docker",
  "GraphQL", "Rust", "Go",
];

export default function RecommendationsPage() {
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [language, setLanguage] = useState("");
  const [languages, setLanguages] = useState([]);
  const [difficulty, setDifficulty] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch dynamic language list
  useEffect(() => {
    api
      .get("/api/languages")
      .then(({ data }) => setLanguages(data.languages || []))
      .catch(() => setLanguages(BASE_SKILLS.filter((s) => !s.includes(" "))));
  }, []);

  function addSkill(skill) {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput("");
  }

  function removeSkill(skill) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(skillInput);
    }
  }

  async function handleSubmit() {
    if (skills.length === 0) {
      toast.error("Add at least one skill or interest first.");
      return;
    }
    setLoading(true);
    try {
      const data = await getRecommendations({
        skills,
        language: language || undefined,
        difficulty: difficulty || undefined,
      });
      setResults(data.items || []);
    } catch {
      toast.error("Couldn't generate recommendations right now.");
    } finally {
      setLoading(false);
    }
  }

  // Suggested chips: base skills not yet selected
  const suggestions = BASE_SKILLS.filter((s) => !skills.includes(s));

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1 flex items-center gap-2">
        <Sparkles size={20} className="text-[var(--color-accent)]" />
        Recommendations
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Tell DevFinder your skills and interests — AI ranks the best matching repositories for you.
        You can type any skill; no restrictions.
      </p>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-8 space-y-4">
        {/* Skills */}
        <div>
          <label className="block text-xs text-[var(--color-text-muted)] mb-2">
            Your skills &amp; interests (type anything)
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/40 text-[var(--color-accent-bright)]"
              >
                {skill}
                <button onClick={() => removeSkill(skill)} aria-label={`Remove ${skill}`}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter, e.g. Django, Kubernetes, WebAssembly…"
            className="w-full rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
          />
          {/* Quick-add chips */}
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => addSkill(s)}
                  className="text-xs px-2 py-1 rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)] transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Optional filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">Language (optional)</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
            >
              <option value="">Any language</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[var(--color-text-muted)]">Difficulty (optional)</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
            >
              <option value="">Any difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-[#0D1117] font-medium text-sm px-4 py-2 transition-colors disabled:opacity-60"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Get recommendations
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Ranking repositories with AI…" />
      ) : results === null ? null : results.length === 0 ? (
        <EmptyState
          message="No matching repositories found."
          hint="Try broader skills like 'Python' or 'web development', or remove the language filter."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((repo) => (
            <RepoCard key={repo.id} repo={repo} />
          ))}
        </div>
      )}
    </div>
  );
}
