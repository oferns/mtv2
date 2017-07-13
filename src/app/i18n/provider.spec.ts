import { TestBed, async } from '@angular/core/testing';

import { getTranslationProvider } from './provider';


describe('getTranslationProviders', () => {
  it('should return a Promise<Object[]>', async(() => {
    const fixture = getTranslationProvider().then(() => {
      expect(fixture instanceof Promise).toBe(true);
    });
  }));

  it('should resolve an array of providers when document["locale"] is set', async(() => {

  }));

  it('should resolve an empty array when document["locale"] is not set', async(() => {

  }));
});
