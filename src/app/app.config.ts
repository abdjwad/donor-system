import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from '@angular/router';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  HttpBackend,
  HttpClient,
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { LanguageService } from './core/services/language.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { TokenService } from './core/services/token.service';

export function createTranslateLoader(httpBackend: HttpBackend): TranslateHttpLoader {
  return new TranslateHttpLoader(
    new HttpClient(httpBackend),
    '/assets/i18n/',
    '.json'
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideClientHydration(withEventReplay()),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]), withFetch()),
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'ar',
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpBackend],
        },
      })
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: (langService: LanguageService) => () => langService.init(),
      deps: [LanguageService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (themeService: ThemeService) => () => themeService.init(),
      deps: [ThemeService],
      multi: true,
    },
    // تحميل بيانات المستخدم عند البداية إذا كان مسجّل دخول
    {
      provide: APP_INITIALIZER,
      useFactory: (authService: AuthService, tokenService: TokenService) => () => {
        if (tokenService.token) {
          return authService.loadCurrentUser().toPromise().catch((err) => {
            // نمسح التوكن فقط إذا كان فعلاً غير صالح (401) — أي خطأ آخر (شبكة/سيرفر
            // مؤقت) ما لازم يسجّل خروج المستخدم بالغلط عند كل ريفرش
            if (err?.status === 401) {
              tokenService.clearToken();
            }
          });
        }
        return Promise.resolve();
      },
      deps: [AuthService, TokenService],
      multi: true,
    },
  ],
};
