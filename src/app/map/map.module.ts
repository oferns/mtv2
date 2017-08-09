import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ToolbarModule } from './toolbar/module';

import { MapComponent, PROVIDERS } from './map.component';

import { HospitalListComponent } from './hospitallist/component';

import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';

@NgModule({
    declarations: [
        MapComponent,
        HospitalListComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        ToolbarModule
    ],
    providers: [
        { provide: PROVIDERS, useClass: GoogleMapService, multi: true }, // PROVIDERS can be any implementation of IMapService
        // { provide: PROVIDERS, useClass: BingMapService, multi: true, },
    ],
    exports: [MapComponent]
})

export class MapModule {

}
