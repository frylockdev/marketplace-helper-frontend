import type {
  Task,
  Notification,
  UserProfile,
  TelegramTokenResponse,
  CreateTaskPayload,
  UpdatePricePayload,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function fetchAPI<T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new APIError(res.status, body.code ?? "UNKNOWN", body.message ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export class APIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

// ── Users ─────────────────────────────────────────────────────────────
export const usersAPI = {
  getMe: (token: string) =>
    fetchAPI<UserProfile>("/api/v1/users/me", {}, token),

  getTelegramToken: (token: string) =>
    fetchAPI<TelegramTokenResponse>(
      "/api/v1/users/me/telegram-token",
      { method: "POST" },
      token
    ),
};

// ── Tasks ─────────────────────────────────────────────────────────────
export const tasksAPI = {
  list: (token: string) =>
    fetchAPI<Task[]>("/api/v1/tasks/", {}, token),

  get: (id: string, token: string) =>
    fetchAPI<Task>(`/api/v1/tasks/${id}`, {}, token),

  create: (payload: CreateTaskPayload, token: string) =>
    fetchAPI<Task>("/api/v1/tasks/", {
      method: "POST",
      body: JSON.stringify(payload),
    }, token),

  updatePrice: (id: string, payload: UpdatePricePayload, token: string) =>
    fetchAPI<Task>(`/api/v1/tasks/${id}/price`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }, token),

  pause: (id: string, token: string) =>
    fetchAPI<Task>(`/api/v1/tasks/${id}/pause`, { method: "POST" }, token),

  resume: (id: string, token: string) =>
    fetchAPI<Task>(`/api/v1/tasks/${id}/resume`, { method: "POST" }, token),

  delete: (id: string, token: string) =>
    fetchAPI<void>(`/api/v1/tasks/${id}`, { method: "DELETE" }, token),
};

// ── Notifications ─────────────────────────────────────────────────────
export const notificationsAPI = {
  listByTask: (taskId: string, token: string) =>
    fetchAPI<Notification[]>(`/api/v1/tasks/${taskId}/notifications/`, {}, token),
};
