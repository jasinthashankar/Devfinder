import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  GitBranch, Compass, Briefcase, GraduationCap,
  Sparkles, Bell, User, ShieldCheck, LogOut, Menu, X, Sun, Moon,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Compass, end: true },
  { to: "/repositories", label: "Repositories", icon: GitBranch },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/internships", label: "Internships", icon: GraduationCap },
  { to: "/recommendations", label: "Recommendations", icon: Sparkles },
  { to: "/alerts", label: "Alerts", icon: Bell },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 inset-y-0 left-0 w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-5 h-16 border-b border-[var(--color-border)]">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="6" fill="#0D1117" />
            <path d="M9 11 L5 16 L9 21" stroke="#7C9A4A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23 11 L27 16 L23 21" stroke="#7C9A4A" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="2.5" fill="#E8A33D" />
          </svg>
          <span className="font-[var(--font-mono)] font-semibold text-[var(--color-text)] tracking-tight">
            DevFinder
          </span>
          <button className="ml-auto lg:hidden text-[var(--color-text-muted)]" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-accent-bright)] font-medium"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}

          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-amber)] font-medium"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
                }`
              }
            >
              <ShieldCheck size={16} />
              Admin
            </NavLink>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="border-t border-[var(--color-border)] p-3 space-y-1">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>

          <NavLink
            to="/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-raised)]"
          >
            <User size={16} />
            <span className="truncate">{user?.username || "Profile"}</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[var(--color-border)] flex items-center px-5 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="text-[var(--color-text-muted)]">
            <Menu size={22} />
          </button>
          <span className="ml-3 font-[var(--font-mono)] font-semibold">DevFinder</span>
          {/* Theme toggle in mobile header too */}
          <button onClick={toggle} className="ml-auto text-[var(--color-text-muted)]">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex-1 p-5 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
