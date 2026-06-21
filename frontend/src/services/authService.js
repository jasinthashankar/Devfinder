import api from "./api";

export async function registerUser(username, email, password) {
  const { data } = await api.post("/api/auth/register", { username, email, password });
  return data;
}

export async function loginUser(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export function saveSession(token, user) {
  localStorage.setItem("devfinder_token", token);
  localStorage.setItem("devfinder_user", JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem("devfinder_token");
  localStorage.removeItem("devfinder_user");
}

export function getCurrentUser() {
  const raw = localStorage.getItem("devfinder_user");
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem("devfinder_token");
}
