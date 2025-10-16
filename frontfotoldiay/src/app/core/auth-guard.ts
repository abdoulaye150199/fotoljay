import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated) {
    // If user is authenticated and trying to access home page, redirect to dashboard
    if (state.url === '/' || state.url === '/home') {
      router.navigate(['/dashboard']);
      return false;
    }
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
