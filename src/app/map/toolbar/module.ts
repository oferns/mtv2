import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ToolbarComponent } from './component';

import { CountryPickerComponent } from './countrypicker/component';
import { ProviderPickerComponent } from './providerpicker/component';
import { ClearMapComponent } from './clearmap/component';

@NgModule({
    declarations: [
        CountryPickerComponent,
        ProviderPickerComponent,
        ClearMapComponent,
        ToolbarComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [],
    exports: [ToolbarComponent]
})

export class ToolbarModule {

}
