import { NgModule, inject, provideAppInitializer } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { TranslateLoader, TranslatePipe, provideTranslateService } from '@ngx-translate/core';

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

@NgModule({
  declarations: [
    AppComponent, LangSwitchComponent,
    LoginPage, RegisterPage, ForgotPasswordPage, SuppliersPage, LinkPage, ProfilePage,
  ],
  imports: [
    BrowserModule, CommonModule, FormsModule,
    IonicModule.forRoot({ mode: 'md' }),
    AppRoutingModule,
    TranslatePipe,
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
