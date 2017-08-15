import { BrowserModule, } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { Logger } from 'angular2-logger/core';

import { AppComponent } from './app.component';
import { MapModule } from './map/map.module';
import { AngelsService } from './services/angels.service';
import { ExcelService } from './services/excel.service';

import { env } from '../env/env';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MapModule
  ],
  providers: [
    { provide: 'IHcoService', useClass: AngelsService },
    ExcelService,
    Logger
  ],
  bootstrap: [AppComponent]
})

export class AppModule {

  constructor(private readonly log: Logger) {
    this.log.level = env.logger.level;
    this.log.info('AppModule constructor called');
  }
}
