import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { TabsPage } from './pages/tabs/tabs.page';
import { SuppliersPage } from './pages/suppliers/suppliers.page';
import { OrdersPage } from './pages/orders/orders.page';
import { ProfilePage } from './pages/profile/profile.page';
import { LinkPage } from './pages/link/link.page';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { BalancePage } from './pages/balance/balance.page';
import { MyCodePage } from './pages/my-code/my-code.page';
import { SupplierPage } from './pages/supplier/supplier.page';
import { CartPage } from './pages/cart/cart.page';
import { OrderDetailPage } from './pages/order-detail/order-detail.page';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tabs/suppliers' },
  // Compte
  { path: 'login', component: LoginPage, canActivate: [guestGuard] },
  { path: 'register', component: RegisterPage, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordPage, canActivate: [guestGuard] },
  // Écrans principaux, avec la barre d'onglets
  {
    path: 'tabs', component: TabsPage, canActivate: [authGuard],
    children: [
      { path: 'suppliers', component: SuppliersPage },
      { path: 'orders', component: OrdersPage },
      { path: 'profile', component: ProfilePage },
      { path: '', pathMatch: 'full', redirectTo: 'suppliers' },
    ],
  },
  // Anciennes adresses, gardées pour les liens existants
  { path: 'suppliers', redirectTo: 'tabs/suppliers' },
  { path: 'profile', redirectTo: 'tabs/profile' },
  // Écrans ouverts par-dessus, sans la barre d'onglets
  { path: 'link', component: LinkPage, canActivate: [authGuard] },
  { path: 'my-code', component: MyCodePage, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsPage, canActivate: [authGuard] },
  { path: 'supplier/:linkId', component: SupplierPage, canActivate: [authGuard] },
  { path: 'supplier/:linkId/cart', component: CartPage, canActivate: [authGuard] },
  { path: 'supplier/:linkId/balance', component: BalancePage, canActivate: [authGuard] },
  { path: 'supplier/:linkId/order/:orderId', component: OrderDetailPage, canActivate: [authGuard] },
  { path: '**', redirectTo: 'tabs/suppliers' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
