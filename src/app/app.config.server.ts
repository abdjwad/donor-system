import { ApplicationConfig, importProvidersFrom, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { Observable, of } from 'rxjs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TranslateLoader, TranslateModule, TranslationObject } from '@ngx-translate/core';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

class TranslateServerLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    // Try dist (production) path first, fall back to src (dev server) path
    const candidates = [
      path.join(process.cwd(), 'dist', 'donor-system', 'browser', 'assets', 'i18n', `${lang}.json`),
      path.join(process.cwd(), 'src', 'assets', 'i18n', `${lang}.json`),
    ];

    for (const filePath of candidates) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return of(JSON.parse(content) as TranslationObject);
      } catch {
        // try next candidate
      }
    }
    return of({} as TranslationObject);
  }
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // Override browser HttpClient-based loader with a filesystem loader for SSR
    importProvidersFrom(
      TranslateModule.forRoot({
        defaultLanguage: 'ar',
        loader: {
          provide: TranslateLoader,
          useClass: TranslateServerLoader,
        },
      })
    ),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
