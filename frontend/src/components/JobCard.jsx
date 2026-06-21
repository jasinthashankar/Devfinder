import { MapPin, ExternalLink, Building2 } from "lucide-react";
import { isReadable, cleanText } from "../utils/textUtils";

export default function JobCard({ job }) {
  // Skip entirely if title or company is garbled
  if (!isReadable(job.title) || !isReadable(job.company)) return null;

  const location = cleanText(job.location, "Remote");

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/50 transition-colors flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-bright)] flex items-center gap-1"
          >
            <span className="truncate">{job.title}</span>
            <ExternalLink size={12} className="opacity-60 flex-shrink-0" />
          </a>
          <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1.5 mt-1">
            <Building2 size={13} />
            {job.company || "Company not listed"}
          </p>
        </div>
        {job.remote && (
          <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent-bright)] flex-shrink-0">
            Remote
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] flex-wrap">
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={12} />
            {location}
          </span>
        )}
        <span className="font-[var(--font-mono)] uppercase opacity-60">{job.source}</span>
      </div>

      {Array.isArray(job.tags) && job.tags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {job.tags
            .filter(tag => isReadable(tag))
            .slice(0, 5)
            .map((tag, i) => (
              <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
                {tag}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
