const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function getVisitorByPhone(phone) {
  return request(`/api/visitors/${encodeURIComponent(phone)}`);
}

export function createOrUpdateVisitor(payload) {
  return request("/api/visitors", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createVisit(payload) {
  return request("/api/visits", {
    method: "POST",
    body: JSON.stringify(payload)
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
