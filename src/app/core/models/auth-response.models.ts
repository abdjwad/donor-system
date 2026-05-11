import { User } from './user.model';

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface MessageResponse {
  message: string;
  status?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
