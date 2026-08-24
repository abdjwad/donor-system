export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  terms: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  code: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export type OtpChannel = 'email' | 'whatsapp';

export interface SendOtpPayload {
  email: string;
  channel: OtpChannel;
  phone?: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp_code: string;
}

export interface PendingRegistration extends RegisterRequest {
  channel: OtpChannel;
}

export interface SocialLoginRequest {
  provider: 'google' | 'facebook';
  token: string;
}
