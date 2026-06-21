import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw, Wifi } from "lucide-react";
import { fetchJobs } from "../services/dataService";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 12;

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [remote, setRemote] = useState("");
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedSearch = useDebounce(search, 500);

  const load = useCallback(() => {
    setLoading(true);
    fetchJobs({
      page,
      page_size: PAGE_SIZE,
      tech: debouncedSearch || undefined,
      remote: remote === "true" ? true : remote === "false" ? false : undefined,
    })
      .then((data) => {
        setJobs(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, remote, refreshKey]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [debouncedSearch, remote]);

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1">Remote Jobs</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 flex items-center gap-1.5">
        <Wifi size={13} className="text-[var(--color-accent)]" />
        Live listings from RemoteOK &amp; Arbeitnow — fetched fresh on every search
      </p>

      {/* Search bar — prominent */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, skill, or keyword — e.g. React, Python, DevOps, ML Engineer…"
            className="w-full rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={remote}
            onChange={(e) => setRemote(e.target.value)}
            className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
          >
            <option value="">All locations</option>
            <option value="true">Remote only</option>
            <option value="false">On-site</option>
          </select>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {total > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] ml-auto">
              {total} result{total !== 1 ? "s" : ""}
              {debouncedSearch ? ` for "${debouncedSearch}"` : ""}
            </span>
          )}
        </div>

        {/* Popular search chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Popular:</span>
          {["Python", "React", "Node.js", "DevOps", "Machine Learning", "Go", "Rust", "Java", "TypeScript"].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearch(tag)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                search === tag
                  ? "border-[var(--color-accent)] text-[var(--color-accent-bright)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/60"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Fetching live job listings…" />
      ) : jobs.length === 0 ? (
        <EmptyState
          message={`No jobs found${debouncedSearch ? ` for "${debouncedSearch}"` : ""}.`}
          hint="Try a different keyword or clear the search."
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job, i) => (
              <JobCard key={job.id ?? job.external_id ?? i} job={job} />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
