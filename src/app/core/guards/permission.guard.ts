import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export function requirePermission(permission: string): CanActivateFn {
  return () => {
    const auth   = inject(AuthService);
    const token  = inject(TokenService);
    const router = inject(Router);

    if (!token.token) return router.createUrlTree(['/auth/login']);

    // التوكن موجود بس بيانات المستخدم لسا ما وصلت (تحميل مؤقت/فشل شبكة عابر عند
    // الإقلاع) — نسمح بالمرور بدل ما نطرد المستخدم للـ login بالغلط، بنفس منطق
    // adminGuard المُتّبع أصلاً؛ الصفحة نفسها بتتعامل مع أي حالة فعلاً غير مصرَّح فيها.
    const user = auth.currentUser();
    if (!user) return true;

    if (auth.hasPermission(permission)) return true;
    return router.createUrlTree(['/unauthorized']);
  };
}
