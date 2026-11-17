import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { SuppliersPage } from './pages/suppliers/suppliers.page';
import { LinkPage } from './pages/link/link.page';
import { ProfilePage } from './pages/profile/profile.page';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'suppliers' },
  // Compte
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordPage, canActivate: [guestGuard] },
  // Compte connecté
  { path: 'suppliers', component: SuppliersPage, canActivate: [authGuard] },
  { path: 'link', component: LinkPage, canActivate: [authGuard] },
  { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'suppliers' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
