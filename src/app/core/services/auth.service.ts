import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, finalize, catchError, throwError } from 'rxjs';

import { TokenService } from './token.service';
import { User } from '../models/user.model';
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SocialLoginRequest,
} from '../models/auth-request.models';
import {
  AuthResponse,
  MessageResponse,
} from '../models/auth-response.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  private readonly API_BASE = '/api';

  readonly currentUser = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);

  login(payload: LoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http.post<AuthResponse>(`${this.API_BASE}/login`, payload).pipe(
      tap((res) => this.handleAuthSuccess(res)),
      tap(() => this.router.navigate(['/dashboard'])),
      finalize(() => this.isLoading.set(false)),
      catchError((err) => this.handleError(err))
    );
  }

  register(payload: RegisterRequest): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http.post<MessageResponse>(`${this.API_BASE}/register`, payload).pipe(
      tap(() =>
        this.router.navigate(['/auth/verify-email'], {
          queryParams: { email: payload.email },
        })
      ),
      finalize(() => this.isLoading.set(false)),
      catchError((err) => this.handleError(err))
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<MessageResponse>(`${this.API_BASE}/forgot-password`, payload)
      .pipe(
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<MessageResponse>(`${this.API_BASE}/reset-password`, payload)
      .pipe(
        tap(() => this.router.navigate(['/auth/login'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  verifyEmail(
    userId: string,
    hash: string,
    otp: string
  ): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(
        `${this.API_BASE}/email/verify/${userId}/${hash}`,
        { otp }
      )
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        tap(() => this.router.navigate(['/dashboard'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  resendVerification(email: string): Observable<MessageResponse> {
    return this.http
      .post<MessageResponse>(`${this.API_BASE}/email/resend`, { email })
      .pipe(catchError((err) => this.handleError(err)));
  }

  socialLogin(payload: SocialLoginRequest): Observable<AuthResponse> {
    this.isLoading.set(true);
    return this.http
      .post<AuthResponse>(`${this.API_BASE}/social-login`, payload)
      .pipe(
        tap((res) => this.handleAuthSuccess(res)),
        tap(() => this.router.navigate(['/dashboard'])),
        finalize(() => this.isLoading.set(false)),
        catchError((err) => this.handleError(err))
      );
  }

  logout(): Observable<MessageResponse> {
    this.isLoading.set(true);
    return this.http
      .post<MessageResponse>(`${this.API_BASE}/logout`, {})
      .pipe(
        tap(() => this.clearSession()),
        finalize(() => this.isLoading.set(false)),
        catchError(() => {
          this.clearSession();
          return throwError(() => new Error('Logout failed'));
        })
      );
  }

  loadCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_BASE}/user`).pipe(
      tap((user) => this.currentUser.set(user)),
      catchError((err) => this.handleError(err))
    );
  }

  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenService.setToken(response.token);
    this.currentUser.set(response.user);
  }

  private clearSession(): void {
    this.tokenService.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    return throwError(() => err);
  }
}
