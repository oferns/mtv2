import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { getTranslationProvider } from './app/i18n/provider';

import { AppModule } from './app/app.module';
import { env } from './env/env';

if (env.production) {
  enableProdMode();
}

getTranslationProvider().then(provider => {
  platformBrowserDynamic().bootstrapModule(AppModule, { providers: provider });
});
