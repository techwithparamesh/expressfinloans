const API = "/api";

export type StaffUser = {
  id: string;
  username: string;
  role: "admin" | "employee";
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export async function getAuthMe(): Promise<{ user: StaffUser } | null> {
  const res = await fetch(`${API}/auth/me`, { credentials: "include" });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export async function login(username: string, password: string): Promise<{ user: StaffUser }> {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Login failed");
  }
  return res.json();
}

export async function logout(): Promise<void> {
  const res = await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" });
  if (!res.ok) throw new Error("Logout failed");
}

export async function staffFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, { ...options, credentials: "include" });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return res;
}

export async function staffJson<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await staffFetch(path, options);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
