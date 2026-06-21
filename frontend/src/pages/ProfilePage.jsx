import { useEffect, useState } from "react";
import { User, Mail, Bookmark } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchSaved, removeSaved } from "../services/dataService";
import { useToast } from "../context/ToastContext";
import RepoCard from "../components/RepoCard";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchSaved()
      .then((data) => setSaved(data.items || []))
      .catch(() => toast.error("Couldn't load saved projects."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(repo) {
    try {
      await removeSaved(repo.id);
      setSaved((prev) => prev.filter((s) => s.repository_id !== repo.id));
      toast.success("Removed from saved.");
    } catch {
      toast.error("Couldn't remove this project.");
    }
  }

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-6">Profile</h1>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/40 flex items-center justify-center text-[var(--color-accent-bright)] font-[var(--font-mono)] text-xl font-semibold">
          {user?.username?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <p className="font-semibold flex items-center gap-1.5">
            <User size={14} className="text-[var(--color-text-muted)]" />
            {user?.username}
          </p>
          <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1">
            <Mail size={13} />
            {user?.email}
          </p>
        </div>
      </div>

      <h2 className="font-[var(--font-mono)] text-lg font-semibold mb-4 flex items-center gap-2">
        <Bookmark size={18} className="text-[var(--color-amber)]" />
        Saved projects
      </h2>

      {loading ? (
        <LoadingSpinner label="Loading saved projects..." />
      ) : saved.length === 0 ? (
        <EmptyState message="No saved projects yet." hint="Bookmark repositories from the Repositories page." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map((item) => (
            <RepoCard
              key={item.id}
              repo={item.repositories}
              onSave={() => handleRemove(item.repositories)}
              isSaved={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
