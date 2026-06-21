import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { GitBranch, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const GITHUB_CLIENT_ID =  "Ov23liafAOqd3QgVn9Xe";

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter both email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back.");
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleGitHubLogin() {
    if (!GITHUB_CLIENT_ID) {
      toast.error("GitHub OAuth is not configured. Add VITE_GITHUB_CLIENT_ID to your .env");
      return;
    }
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = "read:user user:email";
    const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
    window.location.href = url;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={22} className="text-[var(--color-accent)]" />
            <span className="font-[var(--font-mono)] text-xl font-semibold text-[var(--color-text)]">
              DevFinder
            </span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] text-center">find your next commit</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
          <h1 className="text-center text-lg font-semibold text-[var(--color-text)] mb-5">Log in</h1>

          {/* GitHub OAuth Button */}
          <button
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-surface)] text-[var(--color-text)] text-sm font-medium py-2.5 transition-colors mb-4"
          >
            <GitHubIcon />
            Continue with GitHub
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs text-[var(--color-text-muted)] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs text-[var(--color-text-muted)] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-accent)] outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] hover:bg-[var(--color-accent-bright)] text-[#0D1117] font-medium text-sm py-2.5 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Log in
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-text-muted)] mt-5">
            New here?{" "}
            <Link to="/register" className="text-[var(--color-accent-bright)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
