import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Logger } from 'angular2-logger/core';

import { IHcoService } from './ihco.service';

import { IRouteStep } from '../map/abstractions/iroutestep';

import { ICountry } from '../data/icountry';
import { IHospital } from '../data/ihospital';
import { IHospitalRoutes } from '../data/ihospitalroutes';

import { Observable } from 'rxjs/Observable';

import 'rxjs/add/operator/publishReplay';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

const countryUrl = 'http://localhost:34562/mt/countries';

const hospitalsUrl = 'http://localhost:34562/mt/country/';

const saveCountryUrl = 'http://localhost:34562/mt/savecountry/';

const saveHospitalUrl = 'http://localhost:34562/mt/savehospital/';

const hospitalUrl = 'http://localhost:34562/mt/hospitalroutes/';

@Injectable()
export class AngelsService implements IHcoService {

    private readonly countriesPromise: Promise<Array<ICountry>>;

    private _countries: Observable<Array<ICountry>>;
    private _hospitals: Map<ICountry, Observable<Array<IHospital>>>;
    private _hospitalRoutes: Map<IHospital, Observable<IHospitalRoutes>>;

    constructor(private readonly http: HttpClient, private readonly log: Logger) {
        this.log.debug(`AngelsService CTor called`);
        this._hospitals = new Map<ICountry, Observable<Array<IHospital>>>();
        this._hospitalRoutes = new Map<IHospital, Observable<IHospitalRoutes>>();
    }

    getCountries = (): Observable<Array<ICountry>> => {
        this.log.debug(`AngelsService getCountries called`);
        if (!this._countries) {
            this._countries = this.http.get<Array<ICountry>>(countryUrl)
                .map(countries => countries)
                .do(countries => this.log.debug(`AngelsService getCountries returned ${countries.length} countries`))
                .publishReplay(1)
                .refCount();
        }
        return this._countries;
    }

    saveCountryData = async (country: ICountry): Promise<ICountry> => {
        this.log.debug(`AngelsService saveCountryData called for ${country.name} (${country.id})`);
        return await new Promise<ICountry>(async (res, rej) => {
            const url = saveCountryUrl + country.id;
            this.log.debug(`AngelsService saveCountryData calling ${url} for ${country.name} (${country.id})`);

            return await this.http.post(url, country)
                .subscribe((country: ICountry) => {
                    this.log.debug(`AngelsService saveCountryData saved country data for ${country.name} (${country.id}) to ${url}`);
                    return res(<ICountry>country)
                },
                err => {
                    this.log.error(`AngelsService saveCountryData ERRORED saving country data
                    for ${country.name} (${country.id}) to ${url}`);
                    this.log.error(err);
                    return rej(err)
                })
        });
    }

    getHospitals = (country: ICountry): Observable<Array<IHospital>> => {
        this.log.debug(`AngelsService getHospitals called for ${country.name} (${country.id})`);

        if (this._hospitals.has(country)) {
            this.log.debug(`AngelsService getHospitals ${country.name} (${country.id}) hospitals found in cache.`);
            return this._hospitals.get(country);
        }

        const url = hospitalsUrl + country.id;

        return this._hospitals.set(country, this.http.get<Array<IHospital>>(url).map(countries => countries)
            .do(countries => this.log.debug(`AngelsService getHospitals returned ${countries.length} countries`))
            .publishReplay(1)
            .refCount())
            .get(country)
    }

    saveHospitalData = async (hospital: IHospital): Promise<IHospital> => {
        this.log.debug(`AngelsService saveHospitalData called for ${hospital.name} (${hospital.id})`);

        return await new Promise<IHospital>((res, rej) => {
            const url = saveHospitalUrl + hospital.id;
            this.log.debug(`AngelsService saveHospitalData saving ${hospital.name} (${hospital.id}) to ${url}`);
            return this.http.post<IHospital>(url, hospital)
                .subscribe(hospital => {
                    this.log.debug(`AngelsService saveHospitalData Saved ${hospital.name} (${hospital.id}) to ${url}`);
                    return res(hospital)
                },
                err => {
                    this.log.debug(`AngelsService saveHospitalData Errored saving ${hospital.name} (${hospital.id}) to ${url}`);
                    this.log.debug(err);
                    return rej(err)
                })
        });
    }

    getHospitalRoutes(hospital: IHospital): Observable<IHospitalRoutes> {
        this.log.debug(`AngelsService getHospitalRoutes called for ${hospital.name} (${hospital.id})`);

        if (this._hospitalRoutes.has(hospital)) {
            this.log.debug(`AngelsService getHospitals ${hospital.name} (${hospital.id}) hospitals found in cache.`);
            return this._hospitalRoutes.get(hospital);
        }

        const url = hospitalUrl + hospital.id;

        return this._hospitalRoutes.set(hospital, this.http.get<IHospitalRoutes>(url).map(routes => routes)
            .do(routes => this.log.debug(`AngelsService getHospitalRoutes for returned 
            ${routes.data ? 'no' : ''} data for Hospital ${hospital.name}`))
            .publishReplay(1)
            .refCount())
            .get(hospital)
    }
}
