import { useEffect, useState, useCallback } from "react";
import { fetchRepositories, saveProject, fetchSaved, removeSaved } from "../services/dataService";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import RepoCard from "../components/RepoCard";
import RepoFilterBar from "../components/RepoFilterBar";
import Pagination from "../components/Pagination";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

const PAGE_SIZE = 12;

export default function RepositoriesPage() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState({ keywords: "", language: "", difficulty: "", min_stars: 0 });
  const [page, setPage] = useState(1);
  const [repos, setRepos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [savingId, setSavingId] = useState(null);

  const debouncedKeywords = useDebouncedValue(filters.keywords, 450);

  const loadRepos = useCallback(() => {
    setLoading(true);
    fetchRepositories({
      keywords: debouncedKeywords || undefined,
      language: filters.language || undefined,
      difficulty: filters.difficulty || undefined,
      min_stars: filters.min_stars || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((data) => {
        setRepos(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error("Couldn't load repositories. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [debouncedKeywords, filters.language, filters.difficulty, filters.min_stars, page]);

  useEffect(() => { loadRepos(); }, [loadRepos]);

  useEffect(() => { setPage(1); }, [debouncedKeywords, filters.language, filters.difficulty, filters.min_stars]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchSaved()
      .then((data) => {
        const ids = new Set((data.items || []).map((s) => s.repository_id));
        setSavedIds(ids);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  async function handleSave(repo) {
    if (!isAuthenticated) {
      toast.info("Log in to save projects.");
      return;
    }
    setSavingId(repo.id);
    try {
      if (savedIds.has(repo.id)) {
        await removeSaved(repo.id);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(repo.id);
          return next;
        });
        toast.success("Removed from saved.");
      } else {
        await saveProject(repo.id);
        setSavedIds((prev) => new Set(prev).add(repo.id));
        toast.success("Saved to your bookmarks.");
      }
    } catch {
      toast.error("Couldn't update saved projects.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1">Repositories</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Open source projects from GitHub, analyzed and ranked by AI.
      </p>

      <RepoFilterBar filters={filters} onChange={setFilters} />

      {loading ? (
        <LoadingSpinner label="Searching GitHub..." />
      ) : repos.length === 0 ? (
        <EmptyState message="No repositories match these filters." hint="Try a broader language or lower star count." />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {repos.map((repo) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                onSave={handleSave}
                isSaved={savedIds.has(repo.id)}
                saving={savingId === repo.id}
              />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
