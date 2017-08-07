import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { IHcoService } from './ihco.service';

import { IRouteStep } from '../map/abstractions/iroutestep';


import { IHospital } from '../data/ihospital';
import { ICountry } from '../data/icountry';

const countryUrl = 'http://localhost:3000/mt/countries';

const hospitalsUrl = 'http://localhost:3000/mt/country/';

const saveCountryUrl = 'http://localhost:3000/mt/savecountry/';

const saveHospitalUrl = 'http://localhost:3000/mt/savehospital/';

@Injectable()
export class AngelsService implements IHcoService {

    private readonly countriesPromise: Promise<Array<ICountry>>;
    private readonly countryMap: Map<number, Promise<Array<IHospital>>> = new Map<number, Promise<Array<IHospital>>>();

    constructor(private readonly http: Http) {
        this.countriesPromise = new Promise<Array<ICountry>>((res, rej) => {
            return this.http.get(countryUrl)
                .toPromise()
                .then(
                countries => res(<Array<ICountry>>countries.json()),
                err => rej(err)
                );
        });
    }

    getCountries(): Promise<Array<ICountry>> {
        return this.countriesPromise;
    }

    saveCountryData(country: ICountry): Promise<ICountry> {
        return new Promise<ICountry>((res, rej) => {
            const url = saveCountryUrl + country.id;
            return this.http.post(url, country)
                .toPromise()
                .then(
                country => {
                    return res(<ICountry>country.json())
                },
                err => {
                    return rej(err)
                })
        });
    }

    getHospitals(country_id: number): Promise<Array<IHospital>> {
        if (this.countryMap.has(country_id)) {
            return this.countryMap.get(country_id);
        }

        const promise = new Promise<Array<IHospital>>((res, rej) => {
            const url = hospitalsUrl + country_id;

            return this.http.get(url)
                .toPromise()
                .then(
                hospitals => {
                    const j = hospitals.json();
                    return res(<Array<IHospital>>j)
                },
                err => rej(err)
                );
        });

        this.countryMap.set(country_id, promise);

        return promise;
    }

    saveHospitalData(hospital: IHospital): Promise<IHospital> {
        return new Promise<IHospital>((res, rej) => {
            const url = saveHospitalUrl + hospital.id;
            return this.http.post(url, hospital)
                .toPromise()
                .then(
                hospital => {
                    res(<IHospital>hospital.json())
                },
                err => {
                    rej(err)
                })
        });
    }

    getHospital(hco_id: number): Promise<IHospital> {
        throw new Error("Method not implemented.");
    }

}