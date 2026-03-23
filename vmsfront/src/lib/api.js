const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const TOKEN_KEY = "vms_auth_token";
const USER_KEY = "vms_auth_user";

/* =========================================
   GENERIC REQUEST HELPER
========================================= */

async function request(path, options = {}) {

  const isFormData = options.body instanceof FormData;
  const token = getAuthToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    let message = "Request failed";

    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {}

    throw new Error(message);
  }

  if (res.status === 204) return null;

  return res.json();
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function login(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (data?.token) {
    localStorage.setItem(TOKEN_KEY, data.token);
  }
  if (data?.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data;
}

export function logout() {
  clearAuth();
  return request("/api/auth/logout", { method: "POST" });
}

export function registerUser(payload, apiKey) {
  return request("/api/auth/register", {
    method: "POST",
    headers: { "x-api-key": apiKey },
    body: JSON.stringify(payload)
  });
}


/* =========================================
   VISITOR API
========================================= */

export function getVisitorByPhone(phone) {
  return request(`/api/visitors/${encodeURIComponent(phone)}`);
}

export function createOrUpdateVisitor(payload) {
  return request("/api/visitors", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


/* =========================================
   VISIT API
========================================= */

export function createVisit(formData) {
  return request("/api/visits", {
    method: "POST",
    body: formData
  });
}

export function getVisits(params = {}) {

  const search = new URLSearchParams(params);
  const query = search.toString();

  return request(`/api/visits${query ? `?${query}` : ""}`);
}

export function checkoutVisit(id) {
  return request(`/api/visits/${id}/checkout`, {
    method: "PUT"
  });
}