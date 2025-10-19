// src/lib/api.js
export const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export function authHeaders() {
  const token = localStorage.getItem("safedocs_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function j(req) {
  const res = await fetch(req.url, req);
  let body = null;
  try { body = await res.json(); } catch { /* noop */ }
  if (!res.ok) {
    const msg = body?.detail || body?.message || `${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body ?? {};
}

export const api = {
  // Auth
  async signup({ email, password }) {
    return j({
      url: `${API_BASE}/auth/signup`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  },
  async login({ email, password }) {
    const body = new URLSearchParams();
    body.set("username", email);
    body.set("password", password);
    return j({
      url: `${API_BASE}/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
  },
  async me() {
    return j({
      url: `${API_BASE}/auth/me`,
      method: "GET",
      headers: { ...authHeaders() },
    });
  },
  async changePassword({ old_password, new_password }) {
    return j({
      url: `${API_BASE}/auth/change-password`,
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ old_password, new_password }),
    });
  },
  async deleteAccount() {
    return j({
      url: `${API_BASE}/auth/delete`,
      method: "DELETE",
      headers: { ...authHeaders() },
    });
  },

  // Health
  async health() {
    return j({ url: `${API_BASE}/health`, method: "GET" });
  },

  // Scan
  async scan(file) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/scan`, {
      method: "POST",
      headers: { ...authHeaders() }, // JWT protects scans per-user
      body: form,
    });
    let data = null;
    try { data = await res.json(); } catch { /* noop */ }
    if (!res.ok) {
      const msg = data?.detail || data?.message || `${res.status} ${res.statusText}`;
      const err = new Error(msg);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  },
};
