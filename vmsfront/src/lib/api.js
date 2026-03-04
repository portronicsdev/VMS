const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

/* =========================================
   GENERIC REQUEST HELPER
========================================= */

async function request(path, options = {}) {

  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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