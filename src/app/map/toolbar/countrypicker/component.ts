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
    country: ICountry;

    @Output()
    onCountryChanged: EventEmitter<ICountry>;

    @Output()
    isLoading: EventEmitter<boolean>;

    constructor(
        @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger) {
        this.onCountryChanged = new EventEmitter<ICountry>();
        this.isLoading = new EventEmitter<boolean>();
        this.isLoading.emit(this.loading = true);
        this.countries = hcoService.getCountries().do(c => {
            this.isLoading.emit(this.loading = false)
        });
    }

    private countryChanged(country: ICountry) {
        this.country = country;
        this.onCountryChanged.emit(country);
    }
}
