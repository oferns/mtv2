import { TRANSLATIONS, TRANSLATIONS_FORMAT, LOCALE_ID } from '@angular/core';

declare var System: any;
const noProviders: Object[] = [];

export function getTranslationProviders(): Promise<Object[]> {

  let locale = document['locale'] as string;

  if (locale === undefined) {
    return new Promise((res, rej) => { return res(noProviders) });
  }

  var filename = `app.${locale}.xlf`;

  return System.import('raw-loader!.' + filename)
    .then((translations: string) => {
      return [
        { provide: TRANSLATIONS, useValue: translations },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' },
        { provide: LOCALE_ID, useValue: locale }
      ];
    })
    .catch((ex) => noProviders);
}