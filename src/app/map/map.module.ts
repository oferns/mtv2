import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { MapComponent} from './map.component';
import { CountryPickerComponent } from './components/countrypicker.component';

@NgModule({
    declarations: [
        MapComponent,
        CountryPickerComponent
    ],
    imports: [
        BrowserModule
    ],
    providers: [
    ],
    exports: [MapComponent]
})

export class MapModule {

}
