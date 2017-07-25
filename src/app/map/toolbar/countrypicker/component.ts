import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { IHcoService } from '../../../services/ihco.service';

export interface ICountry {
    name: string;
    id: number;
}

@Component({
    selector: 'app-map-country',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class CountryPickerComponent implements OnInit {

    countries: ICountry[] = [];

    @Output()
    selectionChanged: EventEmitter<ICountry> = new EventEmitter();

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService) { }

    selectItem(value: number): void {
        this.selectionChanged.emit(this.countries[value]);
    }

    ngOnInit(): void {
        this.countries.push({ id: -1, name: 'Please Select..' });
        this.hcoService.getCountries().then((countries) => {
            this.countries = this.countries.concat(countries);
        });
    }
}
