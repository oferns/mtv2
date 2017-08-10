import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

    private countriesPromise: Promise<Array<ICountry>>;
    private countryMap: Map<number, Promise<Array<IHospital>>> = new Map<number, Promise<Array<IHospital>>>();
    
    

    constructor(private readonly http: HttpClient) {
        this.countriesPromise = new Promise<Array<ICountry>>((res, rej) => {
            return this.http.get<Array<ICountry>>(countryUrl)
                .subscribe(
                countries => res(<Array<ICountry>>countries),
                err => rej(err)
                );
        });
    }

    getCountries = (): Promise<Array<ICountry>> => {
        return this.countriesPromise;
    }

    saveCountryData = (country: ICountry): Promise<ICountry> => {
        return new Promise<ICountry>((res, rej) => {
            const url = saveCountryUrl + country.id;
            return this.http.post(url, country)
                .subscribe(country => {
                    return res(<ICountry>country)
                },
                err => {
                    return rej(err)
                })
        });
    }

    getHospitals = (country_id: number): Promise<Array<IHospital>> => {
        if (this.countryMap.has(country_id)) {
            return this.countryMap.get(country_id);
        }
        const _me = this;
        const url = hospitalsUrl + country_id;
        const promise = new Promise<Array<IHospital>>((res, rej) => {
            this.http.get<Array<IHospital>>(url)
                .subscribe(hospitals => {
                    res(hospitals);
                },
                err => {
                    rej(err)
                })
        });

        this.countryMap.set(country_id, promise);
        return this.getHospitals(country_id);
    }

    saveHospitalData(hospital: IHospital): Promise<IHospital> {
        return new Promise<IHospital>((res, rej) => {
            const url = saveHospitalUrl + hospital.id;
            return this.http.post<IHospital>(url, hospital)
                .subscribe(hospital => {
                    return res(hospital)
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