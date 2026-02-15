const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Pull the token from storage
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // If token exists, add it to Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    // Log CORS or network errors for debugging
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      console.error('Fetch Error: Check CORS settings and API URL:', {
        apiUrl: API_BASE_URL,
        endpoint: endpoint,
        error: err.message
      });
      throw new Error(`Cannot reach backend at ${API_BASE_URL}. Check CORS and network connection.`);
    }
    throw err;
  }
};