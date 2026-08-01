import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService  = inject(AuthService);
  const token        = tokenService.token;

  // أضف Accept + Authorization لكل request للـ API
  let cloned = req.clone({
    headers: req.headers.set('Accept', 'application/json'),
  });

  if (token) {
    cloned = cloned.clone({
      headers: cloned.headers.set('Authorization', `Bearer ${token}`),
    });
  }

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      // توكن منتهي أو غير صالح → تسجيل خروج قسري موحّد عبر AuthService.forceLogout()
      // (محمي هناك من التكرار المتزامن لو كذا طلب فشلوا بـ401 بنفس اللحظة)
      if (err.status === 401 && tokenService.token) {
        authService.forceLogout();
      }
      return throwError(() => err);
    })
  );
};
