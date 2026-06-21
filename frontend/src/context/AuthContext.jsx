import { createContext, useContext, useState, useCallback } from "react";
import { loginUser, registerUser, saveSession, clearSession, getCurrentUser } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(email, password);
      saveSession(data.access_token, data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.detail || "Login failed. Check your credentials.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await registerUser(username, email, password);
      saveSession(data.access_token, data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.detail || "Registration failed. Try a different email.";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
