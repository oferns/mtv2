import { NgModule, InjectionToken } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import {
    MdSelectModule
    , MdProgressSpinnerModule
    , MdButtonModule
    , MdIconModule
    , MdRadioModule
    , MdButtonToggleModule
    , MdProgressBarModule
    , MdToolbarModule
} from '@angular/material';

import { ToolbarComponent } from './component';

import { CountryPickerComponent } from './countrypicker/component';
import { ProviderPickerComponent } from './providerpicker/component';
import { ClearMapComponent } from './clearmap/component';
import { DrawRoutesComponent } from './drawroutes/component';
import { ClustererComponent } from './clusterer/component';

import { IMapService } from '../abstractions/imap.service';

export { PROVIDERS } from './providerpicker/component';

@NgModule({
    declarations: [
        CountryPickerComponent,
        ProviderPickerComponent,
        ClearMapComponent,
        DrawRoutesComponent,
        ClustererComponent,
        ToolbarComponent
    ],
    imports: [
        BrowserModule,
        FormsModule,
        MdSelectModule,
        MdProgressSpinnerModule,
        MdButtonModule,
        MdIconModule,
        MdRadioModule,
        MdButtonToggleModule,
        MdProgressBarModule,
        MdToolbarModule
    ],
    providers: [
    ],

    exports: [ToolbarComponent]
})

export class ToolbarModule {

}
