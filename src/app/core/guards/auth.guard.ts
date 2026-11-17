import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Écrans du compte connecté : sans session, retour à la connexion. */
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn ? true : inject(Router).createUrlTree(['/login']);
};

/** Connexion, inscription, mot de passe oublié : déjà connecté, on va aux fournisseurs. */
export const guestGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn ? inject(Router).createUrlTree(['/suppliers']) : true;
};
