import { TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';
import { env } from '../../env/env';

declare var System: any;
const noProviders: object[] = [];

export function getTranslationProvider(): Promise<object[]> {

  const locale = document['locale'] as string || 'en';

  const filename = `app.${locale}.xlf`;

  return System.import('raw-loader!./' + filename)
    .then((translations: string) => {
      return [
        { provide: TRANSLATIONS, useValue: translations },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: LOCALE_ID, useValue: locale }
      ];
    })
    .catch(() => noProviders );
}
