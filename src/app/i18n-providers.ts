import { TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';

declare var System: any;

export function getTranslationProviders(): Promise<Object[]> {

  let locale = document['locale'] as string;

  const noProviders: Object[] = [];

  var filename = 'app.' + locale + '.xlf';

  return System.import('raw-loader!./i18n/' + filename)
    .then((translations: string) => {
      return [
        { provide: TRANSLATIONS, useValue: translations },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: LOCALE_ID, useValue: locale }
      ];
    })
    .catch(() => noProviders);
}