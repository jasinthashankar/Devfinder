import { useEffect, useState, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { fetchInternships } from "../services/dataService";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import JobCard from "../components/JobCard";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 12;

export default function InternshipsPage() {
  const [page, setPage] = useState(1);
  const [tech, setTech] = useState("");
  const [location, setLocation] = useState("");
  const [internships, setInternships] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedTech = useDebouncedValue(tech, 450);

  const load = useCallback(
    (forceRefresh = false) => {
      setLoading(true);
      fetchInternships({
        page,
        page_size: PAGE_SIZE,
        tech: debouncedTech || undefined,
        location: location || undefined,
        refresh: forceRefresh,
      })
        .then((data) => {
          setInternships(data.items || []);
          setTotal(data.total || 0);
        })
        .catch(() => setInternships([]))
        .finally(() => setLoading(false));
    },
    [page, debouncedTech, location, refreshKey]
  );

  useEffect(() => {
    load(refreshKey > 0);
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedTech, location]);

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1">Internships</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Intern, trainee, junior and fresher roles sourced live from RemoteOK and Arbeitnow.
        Matched on title, tags, and description.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={tech}
            onChange={(e) => setTech(e.target.value)}
            placeholder="Search by skill or keyword, e.g. Python, ML, frontend…"
            className="w-full rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] pl-9 pr-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none sm:w-44"
        />
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors disabled:opacity-60"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner label="Searching for internship listings…" />
      ) : internships.length === 0 ? (
        <EmptyState
          message="No internship listings found right now."
          hint="Try clearing filters or clicking Refresh — listings update every 30 minutes."
        />
      ) : (
        <>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {total} role{total !== 1 ? "s" : ""} found (live)
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {internships.map((job, i) => (
              <JobCard key={job.id ?? i} job={job} />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
