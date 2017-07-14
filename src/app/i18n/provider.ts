import { TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';
import { env } from '../../env/env';

declare var System: any;
const noProviders: Object[] = [];

export function getTranslationProvider(): Promise<Object[]> {

  let locale = document['locale'] as string || 'en';

  let filename = `app.${locale}.xlf`;

  return System.import('raw-loader!./' + filename)
    .then((translations: string) => {
      return [
        { provide: TRANSLATIONS, useValue: translations },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: LOCALE_ID, useValue: locale }
      ];
    })
    .catch(() => { noProviders });
}