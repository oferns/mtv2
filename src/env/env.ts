// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { Level } from 'angular2-logger/core';

// AIzaSyD0HAQrkFp8aELPTUPIwRgd_eym_seQ5z8
// AIzaSyAQW-eSdGKdaAQGQdFIHihlJ0bq63qRKmg
export const env = {
  production: false,
  logger: {
    level: Level.DEBUG
  },
  GM_API_KEY: 'AIzaSyDf-K64SeHNpqofgxO0mN4odfUefIxcdiQ',
  BM_API_KEY: 'An79vnBp7nhzQWaCmoVrKTZLngj4RvNRtB7ebt3FfVU9pyaGl7dAjCm4Y6gubOV9'

};
