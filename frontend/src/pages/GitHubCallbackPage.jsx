import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import { saveSession } from "../services/authService";
import LoadingSpinner from "../components/LoadingSpinner";

export default function GitHubCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();
  const called = useRef(false); // prevent double call

  useEffect(() => {
    if (called.current) return; // already running
    called.current = true;

    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      toast.error("GitHub login failed — no code returned.");
      navigate("/login");
      return;
    }

    api.post("/api/auth/github", { code })
      .then(({ data }) => {
        saveSession(data.access_token, data.user);
        setUser(data.user);
        toast.success(`Welcome, ${data.user.username}!`);
        navigate("/", { replace: true });
      })
      .catch(() => {
        toast.error("GitHub login failed. Please try again.");
        navigate("/login");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
      <LoadingSpinner label="Signing you in with GitHub…" />
    </div>
  );
}