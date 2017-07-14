import gm = google.maps;

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { MapComponent } from './map.component';
import { DirectionService } from './services/direction.service';

@NgModule({
    declarations: [
        MapComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [DirectionService, gm.DirectionsService],
    exports: [MapComponent],
})

export class MapModule {


}
