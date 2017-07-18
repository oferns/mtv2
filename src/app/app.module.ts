import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { MapModule } from './map/map.module';
import { TestHcoService } from './services/test.hco.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MapModule
  ],
  providers: [{ provide: 'IHcoService', useClass: TestHcoService }],
  bootstrap: [AppComponent]
})

export class AppModule {}
