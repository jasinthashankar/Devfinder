import { useEffect, useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { createAlert, fetchAlerts } from "../services/dataService";
import { useToast } from "../context/ToastContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";

export default function AlertsPage() {
  const toast = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [language, setLanguage] = useState("");
  const [minStars, setMinStars] = useState(0);
  const [keywords, setKeywords] = useState("");

  function loadAlerts() {
    setLoading(true);
    fetchAlerts()
      .then((data) => setAlerts(data.items || []))
      .catch(() => toast.error("Couldn't load your alerts."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadAlerts(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createAlert({ language: language || null, minimum_stars: minStars, keywords: keywords || null });
      toast.success("Alert created. You'll get an email when new matches appear.");
      setLanguage("");
      setMinStars(0);
      setKeywords("");
      loadAlerts();
    } catch {
      toast.error("Couldn't create the alert. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-[var(--font-mono)] text-2xl font-bold mb-1 flex items-center gap-2">
        <Bell size={20} className="text-[var(--color-accent)]" />
        Alerts
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Get an email when new repositories match your criteria. Checked every 12 hours.
      </p>

      <form onSubmit={handleCreate} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 mb-8 grid sm:grid-cols-3 gap-3">
        <input
          type="text"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Language (e.g. Python)"
          className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none"
        />
        <input
          type="number"
          min={0}
          value={minStars}
          onChange={(e) => setMinStars(Number(e.target.value))}
          placeholder="Minimum stars"
          className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none"
        />
        <input
          type="text"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="Keywords (e.g. chatbot)"
          className="rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm focus:border-[var(--color-accent)] outline-none"
        />
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-3 flex items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-[#0D1117] font-medium text-sm py-2.5 transition-colors disabled:opacity-60"
        >
          {submitting && <Loader2 size={14} className="animate-spin" />}
          Create alert
        </button>
      </form>

      {loading ? (
        <LoadingSpinner label="Loading your alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState message="No alerts set up yet." hint="Create one above to get notified about new matches." />
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3 text-sm flex-wrap">
                {alert.language && (
                  <span className="px-2 py-0.5 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)]">{alert.language}</span>
                )}
                {alert.minimum_stars > 0 && (
                  <span className="text-[var(--color-amber)]">{alert.minimum_stars}+ stars</span>
                )}
                {alert.keywords && (
                  <span className="text-[var(--color-text-muted)]">"{alert.keywords}"</span>
                )}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${alert.active ? "border-[var(--color-accent)]/40 text-[var(--color-accent-bright)]" : "border-[var(--color-border)] text-[var(--color-text-muted)]"}`}>
                {alert.active ? "Active" : "Paused"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
