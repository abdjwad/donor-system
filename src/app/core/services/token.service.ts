import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// sessionStorage (مش localStorage) — التوكن بينمسح تلقائياً لما يسكّر المستخدم التبويب/المتصفح
// (بغض النظر عن نوع الحساب: متبرع/أدمن/مقاول/متضرر)، بعكس الريفرش أو التنقل داخل نفس
// التبويب يلي بيضل محافظ عليه (نفس التبويب = نفس الجلسة، تبويب/متصفح جديد = تسجيل دخول من جديد).
@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY  = 'AuthToken';
  private readonly platformId = inject(PLATFORM_ID);

  // signal reactive — الـ navbar يتحدث فوراً بدون reload
  private readonly _hasToken = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._hasToken.set(!!sessionStorage.getItem(this.TOKEN_KEY));
    }
  }

  get token(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // signal للقراءة من الـ templates
  readonly hasToken = this._hasToken.asReadonly();

  setToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this._hasToken.set(true);
  }

  clearToken(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    sessionStorage.removeItem(this.TOKEN_KEY);
    this._hasToken.set(false);
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}
