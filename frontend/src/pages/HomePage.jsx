import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GitBranch, Briefcase, Sparkles, ArrowRight, RefreshCw, GraduationCap } from "lucide-react";
import { fetchRepositories } from "../services/dataService";
import { useAuth } from "../context/AuthContext";
import RepoCard from "../components/RepoCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function HomePage() {
  const { user } = useAuth();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadTrending = (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    fetchRepositories({ page: 1, page_size: 6, refresh: true })
      .then((data) => {
        setTrending(data.items || []);
        setLastUpdated(new Date());
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadTrending(false);
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 lg:p-10">
        <p className="prompt font-[var(--font-mono)] text-sm text-[var(--color-text-muted)] mb-3">
          git log --author=&quot;{user?.username || "you"}&quot; --oneline
        </p>
        <h1 className="text-3xl lg:text-4xl font-[var(--font-mono)] font-bold text-[var(--color-text)] leading-tight">
          Find your next commit.
        </h1>
        <p className="text-[var(--color-text-muted)] mt-3 max-w-xl">
          Search open source repos, remote jobs, and internships —
          all ranked and summarized by AI, in one dashboard.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-[#0D1117] font-medium px-4 py-2 transition-colors"
          >
            Browse repositories
          </Link>
          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1.5 text-sm rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] px-4 py-2 transition-colors"
          >
            <Sparkles size={14} />
            Get AI recommendations
          </Link>
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { to: "/repositories", icon: GitBranch, label: "Repositories" },
          { to: "/jobs", icon: Briefcase, label: "Remote jobs" },
          { to: "/internships", icon: GraduationCap, label: "Internships" },
          { to: "/recommendations", icon: Sparkles, label: "Recommendations" },
        ].map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3 hover:border-[var(--color-accent)]/50 transition-colors"
          >
            <Icon size={18} className="text-[var(--color-accent)]" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </section>

      {/* Trending repos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-[var(--font-mono)] text-lg font-semibold">Trending now</h2>
            {lastUpdated && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => loadTrending(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-60"
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
            <Link
              to="/repositories"
              className="text-sm text-[var(--color-accent-bright)] flex items-center gap-1 hover:underline"
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Fetching trending repositories from GitHub…" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trending.length > 0 ? (
              trending.map((repo, i) => <RepoCard key={repo.full_name || repo.id || i} repo={repo} />)
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] col-span-3">
                No trending repositories found. Try refreshing.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
