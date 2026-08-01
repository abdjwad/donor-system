import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TokenService } from '../services/token.service';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const guestGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router       = inject(Router);
  const http         = inject(HttpClient);

  // لا يوجد توكن → دخّل مباشرةً
  if (!tokenService.token) return true;

  // يوجد توكن → تحقق من صلاحيته
  return http.get(`${environment.apiUrl}/v1/auth/me`).pipe(
    map(() => router.createUrlTree(['/dashboard'])), // توكن صالح → dashboard
    catchError((err: HttpErrorResponse) => {
      // نمسح التوكن فقط إذا كان فعلاً غير صالح (401) — خطأ شبكة/سيرفر مؤقت
      // ما لازم يسجّل خروج المستخدم بالغلط
      if (err.status === 401) {
        tokenService.clearToken();
      }
      return of(true); // واسمح بالدخول للـ login بكل الأحوال
    })
  );
};
