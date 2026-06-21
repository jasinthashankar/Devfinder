import { Search } from "lucide-react";

const LANGUAGES = ["", "Python", "JavaScript", "TypeScript", "Java", "Go", "Rust", "C++", "HTML"];
const DIFFICULTIES = ["", "Beginner", "Intermediate", "Advanced"];

export default function RepoFilterBar({ filters, onChange }) {
  function update(key, value) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={filters.keywords}
          onChange={(e) => update("keywords", e.target.value)}
          placeholder="Search repositories, e.g. chatbot, scraper..."
          className="w-full rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] pl-9 pr-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
        />
      </div>

      <select
        value={filters.language}
        onChange={(e) => update("language", e.target.value)}
        className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang}>{lang || "All languages"}</option>
        ))}
      </select>

      <select
        value={filters.difficulty}
        onChange={(e) => update("difficulty", e.target.value)}
        className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
      >
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{d || "Any difficulty"}</option>
        ))}
      </select>

      <select
        value={filters.min_stars}
        onChange={(e) => update("min_stars", Number(e.target.value))}
        className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
      >
        <option value={0}>Any stars</option>
        <option value={10}>10+ stars</option>
        <option value={100}>100+ stars</option>
        <option value={1000}>1,000+ stars</option>
        <option value={10000}>10,000+ stars</option>
      </select>
    </div>
  );
}
