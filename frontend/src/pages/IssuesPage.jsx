import { useEffect, useState } from "react";
import { ExternalLink, Tag, RefreshCw } from "lucide-react";
import { fetchIssues } from "../services/dataService";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function IssuesPage() {
  const [language, setLanguage] = useState("");
  const [languages, setLanguages] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load dynamic language list from backend
  useEffect(() => {
    api
      .get("/api/languages")
      .then(({ data }) => setLanguages(data.languages || []))
      .catch(() => {
        // Static fallback if endpoint fails
        setLanguages([
          "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust",
          "C++", "Ruby", "PHP", "Swift", "Kotlin", "C#", "Dart",
        ]);
      });
  }, []);

  const loadIssues = (lang, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    fetchIssues({ language: lang || undefined })
      .then((data) => setIssues(data.items || []))
      .catch(() => setIssues([]))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadIssues(language);
  }, [language]);

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1">Good first issues</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Live open issues labeled &ldquo;good first issue&rdquo; — fetched directly from GitHub,
        updated on every page load.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
        >
          <option value="">All languages</option>
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>

        <button
          onClick={() => loadIssues(language, true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>

        <span className="text-xs text-[var(--color-text-muted)] ml-auto">
          {issues.length > 0 && `${issues.length} results — live from GitHub`}
        </span>
      </div>

      {loading ? (
        <LoadingSpinner label="Searching GitHub for beginner-friendly issues…" />
      ) : issues.length === 0 ? (
        <EmptyState
          message="No good first issues found right now."
          hint="Try a different language filter, or click Refresh."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {issues.map((repo, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/50 transition-colors"
            >
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-bright)] flex items-center gap-1"
              >
                {repo.full_name || repo.name}
                <ExternalLink size={12} className="opacity-60" />
              </a>
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 mt-1.5">
                {repo.description || "No description available."}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className="flex items-center gap-1 text-xs text-[var(--color-accent-bright)]">
                  <Tag size={12} />
                  {repo.good_first_issues} good first issue
                  {repo.good_first_issues === 1 ? "" : "s"}
                </span>
                {repo.language && repo.language !== "Unknown" && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {repo.language}
                  </span>
                )}
                {repo.stars > 0 && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    ⭐ {repo.stars?.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
