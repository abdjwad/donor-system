import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Observable, tap, finalize, catchError, throwError, map } from 'rxjs';

import { TokenService } from './token.service';
import { NotificationsApiService } from './notifications-api.service';
import { User } from '../models/user.model';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SendOtpPayload,
  VerifyOtpPayload,
  PendingRegistration,
} from '../models/auth-request.models';
import {
  ApiResponse,
  AuthResponse,
  LaravelAuthData,
  MessageResponse,
} from '../models/auth-response.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http             = inject(HttpClient);
  private readonly tokenService     = inject(TokenService);
  private readonly router           = inject(Router);
  private readonly notificationsApi = inject(NotificationsApiService);

  private readonly API = `${environment.apiUrl}/v1`;

  readonly currentUser = signal<User | null>(null);
  readonly isLoading   = signal<boolean>(false);

  // يمنع تعدد استدعاءات forceLogout() المتزامنة (مثلاً عدة طلبات API تفشل بـ401 بنفس اللحظة)
  // من التسبب بعدة router.navigate() متضاربة (كان بيطلع "InvalidStateError: Transition was aborted")
  private loggingOut = false;

  // بيانات التسجيل المؤقتة بين خطوة إرسال الـ OTP وخطوة التحقق (تُفرَّغ بعد إتمام التسجيل)
  private readonly pendingRegistration = signal<PendingRegistration | null>(null);

  // ── Login ──────────────────────────────────────────────────────
  login(payload: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<LaravelAuthData>>(`${this.API}/auth/login`, payload)
      .pipe(
        map((res) => ({ token: res.data.token, user: res.data.user })),
        tap((res) => this.handleAuthSuccess(res)),
        tap(() => this.router.navigate(['/dashboard'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Register donor ─────────────────────────────────────────────
  register(payload: RegisterRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<LaravelAuthData>>(`${this.API}/auth/register`, {
        name:                  payload.name,
        email:                 payload.email,
        phone:                 payload.phone,
        password:              payload.password,
        password_confirmation: payload.password_confirmation,
        lang:                  'ar',
      })
      .pipe(
        map((res) => ({ token: res.data.token, user: res.data.user })),
        tap((res) => this.handleAuthSuccess(res)),
        tap(() => this.router.navigate(['/dashboard'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Logout ─────────────────────────────────────────────────────
  logout(): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<null>>(`${this.API}/auth/logout`, {})
      .pipe(
        map(() => ({ message: 'Logged out' })),
        tap(() => this.clearSession()),
        finalize(() => this.isLoading.set(false)),
        catchError(() => { this.clearSession(); return throwError(() => new Error()); })
      );
  }

  // ── Current user ───────────────────────────────────────────────
  loadCurrentUser(): Observable<User> {
    return this.http
      .get<ApiResponse<User>>(`${this.API}/auth/me`)
      .pipe(
        map((res) => res.data),
        tap((user) => this.currentUser.set(user)),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Update profile ────────────────────────────────────────────
  updateProfile(payload: { name?: string; phone?: string; lang?: string }): Observable<User> {
    return this.http
      .put<ApiResponse<User>>(`${this.API}/profile`, payload)
      .pipe(
        map((res) => res.data),
        tap((user) => this.currentUser.set(user)),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Change password ────────────────────────────────────────────
  changePassword(payload: { current_password: string; password: string; password_confirmation: string }): Observable<MessageResponse> {
    return this.http
      .put<ApiResponse<null>>(`${this.API}/profile/password`, payload)
      .pipe(
        map(() => ({ message: 'Password changed' })),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Forgot / Reset (future) ───────────────────────────────────
  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<MessageResponse>(`${this.API}/auth/forgot-password`, payload)
      .pipe(finalize(() => this.isLoading.set(false)), catchError((err) => this.handleError(err)));
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<MessageResponse>(`${this.API}/auth/reset-password`, payload)
      .pipe(
        tap(() => this.router.navigate(['/auth/login'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  // ── Private helpers ────────────────────────────────────────────
  private handleAuthSuccess(res: AuthResponse): void {
    this.tokenService.setToken(res.token);
    this.currentUser.set(res.user);
    this.loggingOut = false; // جلسة جديدة صحيحة — نسمح بمعالجة أي 401 مستقبلي من جديد
  }

  private clearSession(): void {
    this.forceLogout();
  }

  /**
   * تسجيل خروج قسري (توكن غير صالح/منتهي — 401 حقيقي من الباك اند).
   * يُستدعى من authInterceptor أيضاً، لذلك محمي من التكرار المتزامن:
   * لو وصلت عدة طلبات فاشلة بـ401 بنفس اللحظة (تحديث الإشعارات + الإحصائيات + السجل...)،
   * كل وحدة كانت عم تنادي router.navigate() لحالها فيسبب تصادم ملاحي (InvalidStateError)
   * وتبقى واجهة قديمة معروضة بالخلفية بينما كل نداء API عم يفشل بصمت.
   */
  forceLogout(): void {
    if (this.loggingOut) return;
    this.loggingOut = true;

    this.tokenService.clearToken();
    this.currentUser.set(null);
    this.notificationsApi.resetState();

    if (!this.router.url.startsWith('/auth/login')) {
      this.router.navigate(['/auth/login']);
    }
  }

  // ── Permissions ───────────────────────────────────────────────
  hasPermission(permission: string): boolean {
    return this.currentUser()?.permissions?.includes(permission) ?? false;
  }

  canAccessAdmin(): boolean {
    const adminPerms = [
      'manage donations', 'manage campaigns', 'create campaigns',
      'distribute funds', 'view donations', 'view public dashboard',
    ];
    return adminPerms.some(p => this.hasPermission(p));
  }

  // ── تسجيل المتبرع عبر OTP (إيميل أو واتساب) ───────────────────
  stagePendingRegistration(data: PendingRegistration): void {
    this.pendingRegistration.set(data);
  }

  getPendingRegistration(): PendingRegistration | null {
    return this.pendingRegistration();
  }

  sendOtp(payload: SendOtpPayload): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<null>>(`${environment.apiUrl}/auth/send-otp`, payload)
      .pipe(
        map((res) => ({ message: res.message })),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  verifyOtp(payload: VerifyOtpPayload): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<ApiResponse<null>>(`${environment.apiUrl}/auth/verify-otp`, payload)
      .pipe(
        map((res) => ({ message: res.message })),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  /** يُستدعى بعد نجاح verifyOtp لإتمام تسجيل المتبرع فعلياً بالبيانات المخزَّنة مؤقتاً. */
  finalizeRegistration(): Observable<AuthResponse> {
    const draft = this.pendingRegistration();
    if (!draft) {
      return throwError(() => new Error('AUTH.ERRORS.SESSION_EXPIRED'));
    }

    return this.register(draft).pipe(tap(() => this.pendingRegistration.set(null)));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
