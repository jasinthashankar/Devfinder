import { useEffect, useState } from "react";
import { ShieldCheck, Users, GitBranch, Briefcase, Bell, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { fetchAdminStats } from "../services/dataService";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";

const STAT_CARDS = [
  { key: "total_users", label: "Users", icon: Users },
  { key: "total_repositories", label: "Repositories", icon: GitBranch },
  { key: "total_jobs", label: "Jobs", icon: Briefcase },
  { key: "active_alerts", label: "Active alerts", icon: Bell },
  { key: "total_searches", label: "Searches logged", icon: Search },
];

export default function AdminPage() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats()
      .then(setStats)
      .catch(() => toast.error("Couldn't load admin stats."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner label="Loading system stats..." />;
  if (!stats) return null;

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1 flex items-center gap-2">
        <ShieldCheck size={20} className="text-[var(--color-amber)]" />
        Admin dashboard
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">System-wide stats, last updated {new Date(stats.last_updated).toLocaleString()}.</p>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <Icon size={16} className="text-[var(--color-accent)] mb-2" />
            <p className="text-2xl font-[var(--font-mono)] font-bold">{stats[key] ?? 0}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
          </div>
        ))}
      </div>

      {stats.popular_languages?.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="font-[var(--font-mono)] text-sm font-semibold mb-4">Popular languages</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.popular_languages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
              <XAxis dataKey="language" stroke="#6E7681" fontSize={12} />
              <YAxis stroke="#6E7681" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#161B22", border: "1px solid #30363D", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#7C9A4A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
