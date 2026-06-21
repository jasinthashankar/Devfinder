import api from "./api";

// ---------------- REPOSITORIES ----------------
export async function fetchRepositories(params = {}) {
  const { data } = await api.get("/api/repos", { params });
  return data;
}

export async function fetchRepositoryById(id) {
  const { data } = await api.get(`/api/repos/${id}`);
  return data;
}

export async function fetchIssues(params = {}) {
  const { data } = await api.get("/api/issues", { params });
  return data;
}

// ---------------- JOBS ----------------
export async function fetchJobs(params = {}) {
  const { data } = await api.get("/api/jobs", { params });
  return data;
}

export async function fetchInternships(params = {}) {
  const { data } = await api.get("/api/internships", { params });
  return data;
}

// ---------------- LANGUAGES ----------------
export async function fetchLanguages() {
  const { data } = await api.get("/api/languages");
  return data; // { languages: [...] }
}

// ---------------- RECOMMENDATIONS ----------------
export async function getRecommendations(payload) {
  const { data } = await api.post("/api/recommend", payload);
  return data;
}

// ---------------- ALERTS ----------------
export async function createAlert(payload) {
  const { data } = await api.post("/api/alerts", payload);
  return data;
}

export async function fetchAlerts() {
  const { data } = await api.get("/api/alerts");
  return data;
}

// ---------------- SAVED PROJECTS ----------------
export async function saveProject(repositoryId) {
  const { data } = await api.post("/api/save", { repository_id: repositoryId });
  return data;
}

export async function fetchSaved() {
  const { data } = await api.get("/api/saved");
  return data;
}

export async function removeSaved(repositoryId) {
  const { data } = await api.delete(`/api/saved/${repositoryId}`);
  return data;
}

// ---------------- ADMIN ----------------
export async function fetchAdminStats() {
  const { data } = await api.get("/api/admin/stats");
  return data;
}
