import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY  = 'AuthToken';
  private readonly platformId = inject(PLATFORM_ID);

  // signal reactive — الـ navbar يتحدث فوراً بدون reload
  private readonly _hasToken = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._hasToken.set(!!localStorage.getItem(this.TOKEN_KEY));
    }
  }

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // signal للقراءة من الـ templates
  readonly hasToken = this._hasToken.asReadonly();

  setToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.setItem(this.TOKEN_KEY, token);
    this._hasToken.set(true);
  }

  clearToken(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.TOKEN_KEY);
    this._hasToken.set(false);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
