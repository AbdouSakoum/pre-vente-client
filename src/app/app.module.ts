import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { TranslateLoader, TranslatePipe, provideTranslateService } from '@ngx-translate/core';
import { PluralPipe } from './shared/plural.pipe';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { BundledTranslateLoader, LanguageService } from './core/services/language.service';
import { BrandService } from './brand/brand.service';
import { LangSwitchComponent } from './shared/components/lang-switch/lang-switch.component';
import { LoginPage } from './pages/login/login.page';
import { RegisterPage } from './pages/register/register.page';
import { ForgotPasswordPage } from './pages/forgot-password/forgot-password.page';
import { SuppliersPage } from './pages/suppliers/suppliers.page';
import { LinkPage } from './pages/link/link.page';
import { ProfilePage } from './pages/profile/profile.page';
import { MyCodePage } from './pages/my-code/my-code.page';
import { TabsPage } from './pages/tabs/tabs.page';
import { OrdersPage } from './pages/orders/orders.page';
import { SupplierPage } from './pages/supplier/supplier.page';
import { CatalogComponent } from './pages/supplier/components/catalog/catalog.component';
import { UsualsComponent } from './pages/supplier/components/usuals/usuals.component';
import { QtyControlComponent } from './pages/supplier/components/qty-control/qty-control.component';
import { QtySheetComponent } from './pages/supplier/components/qty-sheet/qty-sheet.component';
import { PromoTagsComponent } from './pages/supplier/components/promo-tags/promo-tags.component';
import { AislesComponent } from './pages/supplier/components/aisles/aisles.component';
import { OffersCarouselComponent } from './pages/suppliers/components/offers-carousel/offers-carousel.component';
import { CartPage } from './pages/cart/cart.page';
import { OrderSentComponent } from './pages/cart/components/order-sent/order-sent.component';
import { NotificationsPage } from './pages/notifications/notifications.page';
import { BalancePage } from './pages/balance/balance.page';
import { NotifButtonComponent } from './shared/components/notif-button/notif-button.component';
import { OrderDetailPage } from './pages/order-detail/order-detail.page';

@NgModule({
  declarations: [
    AppComponent, LangSwitchComponent,
    LoginPage, RegisterPage, ForgotPasswordPage, TabsPage, SuppliersPage, OrdersPage, LinkPage, ProfilePage, MyCodePage,
    SupplierPage, CatalogComponent, UsualsComponent, QtyControlComponent, QtySheetComponent, PromoTagsComponent, AislesComponent, OffersCarouselComponent,
    CartPage, OrderSentComponent, OrderDetailPage, NotificationsPage, NotifButtonComponent, BalancePage,
  ],
  imports: [
    BrowserModule, CommonModule, FormsModule,
    IonicModule.forRoot({ mode: 'md' }),
    AppRoutingModule,
    TranslatePipe, PluralPipe,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({
      // Fournisseur explicite : une fois minifiée, la classe n'est plus reconnue comme telle
      // par provideTranslateLoader() et serait appelée sans `new`.
      loader: { provide: TranslateLoader, useClass: BundledTranslateLoader },
      fallbackLang: 'fr',
    }),
    provideAppInitializer(() => {
      inject(BrandService).init();
      return inject(LanguageService).init();
    }),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
