import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/* Inverso de authGuard: si ya hay una sesión activa (token en localStorage),
   saca al usuario de /login directo a /ventas en vez de mostrarle el
   formulario de nuevo — pasa al reabrir una pestaña ya logueado. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.estaLogueado()) {
    router.navigateByUrl('/ventas');
    return false;
  }

  return true;
};
