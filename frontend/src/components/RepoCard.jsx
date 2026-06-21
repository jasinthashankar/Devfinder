import { Star, GitFork, CircleDot, ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";
import { isReadable, cleanText } from "../utils/textUtils";

const DIFFICULTY_STYLES = {
  Beginner: "text-[var(--color-accent-bright)] border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10",
  Intermediate: "text-[var(--color-amber)] border-[var(--color-amber)]/40 bg-[var(--color-amber)]/10",
  Advanced: "text-[var(--color-danger)] border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10",
};

export default function RepoCard({ repo, onSave, isSaved, saving }) {
  // Get name from either live GitHub field or DB field
  const repoName = repo.name || repo.repo_name || "";
  const fullName = repo.full_name || `${repo.owner || ""}/${repoName}`;
  const url = repo.url || repo.html_url || "#";
  const description = cleanText(repo.ai_summary || repo.description, "No description available.");

  // Skip garbled repos
  if (!isReadable(repoName) || !isReadable(repo.owner)) return null;

  const difficultyStyle = DIFFICULTY_STYLES[repo.difficulty] || "text-[var(--color-text-muted)] border-[var(--color-border)] bg-transparent";

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-accent)]/50 transition-colors flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-[var(--font-mono)] text-xs text-[var(--color-text-muted)] truncate">
            {fullName}
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--color-text)] hover:text-[var(--color-accent-bright)] flex items-center gap-1 mt-0.5"
          >
            <span className="truncate">{repoName}</span>
            <ExternalLink size={12} className="opacity-60 flex-shrink-0" />
          </a>
        </div>
        {onSave && (
          <button
            onClick={() => onSave(repo)}
            disabled={saving}
            aria-label={isSaved ? "Remove from saved" : "Save project"}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-amber)] disabled:opacity-50 flex-shrink-0"
          >
            {isSaved ? <BookmarkCheck size={18} className="text-[var(--color-amber)]" /> : <Bookmark size={18} />}
          </button>
        )}
      </div>

      <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">
        {description}
      </p>

      <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] flex-wrap">
        <span className="flex items-center gap-1">
          <Star size={13} className="text-[var(--color-amber)]" />
          {(repo.stars || repo.stargazers_count || 0).toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <GitFork size={13} />
          {(repo.forks || repo.forks_count || 0).toLocaleString()}
        </span>
        {(repo.good_first_issues || 0) > 0 && (
          <span className="flex items-center gap-1">
            <CircleDot size={13} className="text-[var(--color-accent)]" />
            {repo.good_first_issues} good first issue{repo.good_first_issues === 1 ? "" : "s"}
          </span>
        )}
        {repo.language && isReadable(repo.language) && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            {repo.language}
          </span>
        )}
      </div>

      {repo.difficulty && (
        <span className={`self-start text-xs px-2 py-0.5 rounded-full border ${difficultyStyle}`}>
          {repo.difficulty}
        </span>
      )}
    </div>
  );
}
