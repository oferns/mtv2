import { BrowserModule,  } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { MapModule } from './map/map.module';
import { TestHcoService } from './services/test.hco.service';
import { AngelsService } from './services/angels.service';

import { ExcelService } from './services/excel.service';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    MapModule
  ],
  providers: [{ provide: 'IHcoService', useClass: AngelsService }, ExcelService],
  bootstrap: [AppComponent]
})

export class AppModule { }
