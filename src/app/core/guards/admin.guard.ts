import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const adminGuard: CanActivateFn = () => {
  const authService  = inject(AuthService);
  const tokenService = inject(TokenService);
  const router       = inject(Router);

  if (!tokenService.token) {
    return router.createUrlTree(['/auth/login']);
  }

  const user = authService.currentUser();

  // Token exists but user signal not yet populated (app still booting) — let through;
  // the component will handle an unauthenticated state if the token is invalid.
  if (!user) {
    return true;
  }

  if (authService.canAccessAdmin()) {
    return true;
  }

  return router.createUrlTree(['/unauthorized']);
};
