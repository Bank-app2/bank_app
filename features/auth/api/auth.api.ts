const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

/**
 * apiFetch — Authenticated fetch wrapper.
 * Accepts a Clerk token, configures headers, and sends request to the backend.
 */
export async function apiFetch<T>(
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json() as Promise<T>;
}
