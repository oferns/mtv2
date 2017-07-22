import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent, PROVIDERS } from './map.component';
import { CountryPickerComponent } from './countrypicker/component';
import { ProviderPickerComponent} from './providerpicker/component';
import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';


@NgModule({
    declarations: [
        MapComponent,
        CountryPickerComponent,
        ProviderPickerComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [
        { provide: PROVIDERS, useClass: GoogleMapService, multi: true }, // PROVIDERS can be any implementation of IMapService
        { provide: PROVIDERS, useClass: BingMapService, multi: true, },

    ],

    exports: [MapComponent]
})

export class MapModule {

}
