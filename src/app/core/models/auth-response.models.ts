import { User } from './user.model';

// ── Laravel API wrapper ───────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Auth ──────────────────────────────────────────────────────
export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

// Laravel wraps: { success, data: { token, user } }
export interface LaravelAuthData {
  token: string;
  user: User;
}

export interface MessageResponse {
  message: string;
  status?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
