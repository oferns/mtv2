import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent, PROVIDERS } from './map.component';
import { CountryPickerComponent } from './components/countrypicker.component';

import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';


@NgModule({
    declarations: [
        MapComponent,
        CountryPickerComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [
        { provide: PROVIDERS, useClass: GoogleMapService, multi: true },
        { provide: PROVIDERS, useClass: BingMapService, multi: true, }
    ],

    exports: [MapComponent]
})

export class MapModule {

}
