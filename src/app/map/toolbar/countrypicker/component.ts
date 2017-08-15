import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Logger } from 'angular2-logger/core';

import { IHcoService } from '../../../services/ihco.service';
import { ICountry } from '../../../data/icountry';

@Component({
    selector: 'app-map-country',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class CountryPickerComponent {

    private countries: Observable<Array<ICountry>>;
    private loading: boolean;

    @Output()
    onCountryChanged: EventEmitter<ICountry>;

    constructor(
        @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger) {
        this.onCountryChanged = new EventEmitter<ICountry>();
        this.loading = true;
        this.countries = hcoService.getCountries().do(c => this.loading = false);
    }

    private countryChanged(country: ICountry) {
        this.onCountryChanged.emit(country);
    }
}
