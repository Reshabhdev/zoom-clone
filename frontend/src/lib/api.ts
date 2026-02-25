/**
 * API fetch helper — routes all backend requests through the Next.js API proxy
 * at /api/[...path] to avoid CORS issues entirely. The proxy runs server-side
 * and forwards requests to the Python backend.
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}, token?: string | null) => {
  // Use token passed as argument, or fall back to localStorage
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Route through the Next.js API proxy (same-origin, no CORS issues)
  const url = `/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        error = { detail: `HTTP ${response.status}: ${response.statusText}` };
      }
      throw new Error(error.detail || "Something went wrong");
    }

    return response.json();
  } catch (err: any) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error('Fetch Error:', { url, error: err.message });
      throw new Error(`Network error. Please check your connection.`);
    }
    throw err;
  }
};