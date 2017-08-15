import { NgModule, InjectionToken } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToolbarModule, PROVIDERS } from './toolbar/module';
import { HttpClientModule } from '@angular/common/http';

import { Logger } from 'angular2-logger/core';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MapComponent } from './map.component';
import { HospitalListComponent } from './hospitallist/component';
import { HospitalComponent } from './hospital/component';

import {
    MdSidenavModule,
    MdListModule,
    MdCheckboxModule,
    MdIconModule,
    MdButtonModule,
    MdProgressSpinnerModule,
    MdButtonToggleModule
} from '@angular/material';

import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';


@NgModule({
    declarations: [
        MapComponent,
        HospitalListComponent,
        HospitalComponent
    ],
    imports: [
        CommonModule,
        BrowserAnimationsModule,
        FormsModule,
        HttpClientModule,
        ToolbarModule,
        MdSidenavModule,
        MdListModule,
        MdButtonModule,
        MdButtonToggleModule,
        MdCheckboxModule,
        MdIconModule,
        MdProgressSpinnerModule
    ],
    providers: [
        { provide: PROVIDERS, useClass: GoogleMapService, multi: true }, // PROVIDERS can be any implementation of IMapService
        { provide: PROVIDERS, useClass: BingMapService, multi: true, },
    ],
    exports: [MapComponent]
})

export class MapModule {
    constructor(private readonly log: Logger) {
        this.log.info('MapModule constructor called');
    }
}
