export type TaskStatus = "active" | "paused" | "broken" | "deleted";

export interface Task {
  id: string;
  url: string;
  max_price: number;
  status: TaskStatus;
  last_checked_at?: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  task_id: string;
  product_url: string;
  product_name: string;
  product_price: number;
  sent_at?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  telegram_linked: boolean;
}

export interface TelegramTokenResponse {
  token: string;
  deep_link: string;
}

export interface CreateTaskPayload {
  url: string;
  max_price: number;
}

export interface UpdatePricePayload {
  max_price: number;
}
