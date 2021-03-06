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
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';


// const countryUrl = '/mt/countries';
// const hospitalsUrl = '/mt/country/';
// const saveCountryUrl = '/mt/savecountry/';
// const hospitalUrl = '/mt/hospitalroutes/';
// const saveHospitalUrl = '/mt/savehospital/';
// const routesUrl = '/mt/countryroutes/';
// const toggleTreatingNoAngelsUrl = '/mt/toggletreating/';
// const toggleFutureTargetUrl = '/mt/togglefuture/';

const countryUrl = 'http://localhost:8081/mt/countries';
const hospitalsUrl = 'http://localhost:8081/mt/country/';
const saveCountryUrl = 'http://localhost:8081/mt/savecountry/';
const hospitalUrl = 'http://localhost:8081/mt/hospitalroutes/';
const routesUrl = 'http://localhost:8081/mt/countryroutes/';
const saveHospitalUrl = 'http://localhost:8081/mt/savehospital/';
const toggleTreatingNoAngelsUrl = 'http://localhost:8081/mt/toggletreating/';
const toggleFutureTargetUrl = 'http://localhost:8081/mt/togglefuture/';



@Injectable()
export class AngelsService implements IHcoService {

    private readonly countriesPromise: Promise<Array<ICountry>>;

    private _countries: Observable<ICountry[]>;
    private _hospitals: Map<number, Observable<IHospital[]>>;
    private _hospitalRoutes: Map<number, Observable<IHospitalRoutes>>;
    private _countryRoutes: Map<number, Observable<IHospitalRoutes[]>>;
    constructor(private readonly http: HttpClient, private readonly log: Logger) {
        this.log.info(`AngelsService CTor called`);
        this._hospitals = new Map<number, Observable<IHospital[]>>();
        this._hospitalRoutes = new Map<number, Observable<IHospitalRoutes>>();
        this._countryRoutes = new Map<number, Observable<IHospitalRoutes[]>>();
    }

    private handleError(error: any) {
        if (error instanceof Response) {
            return Observable.throw(error.json()['error'] || 'backend server error');
        }
        return Observable.throw(error || 'backend server error');
    }

    getCountries = (): Observable<ICountry[]> => {
        this.log.debug(`AngelsService getCountries called`);
        if (!this._countries) {
            this._countries = this.http.get<Array<ICountry>>(countryUrl)
                .map(countries => countries)
                .do(countries => this.log.debug(`AngelsService getCountries returned ${countries.length} countries`))
                .publishReplay(1)
                .refCount()
                .catch(this.handleError);
        }
        return this._countries;
    }

    saveCountryData = (country: ICountry): Observable<ICountry> => {
        this.log.info(`AngelsService saveCountryData called for ${country.name} (${country.id})`);
        const url = saveCountryUrl + country.id;
        this.log.info(`AngelsService saveCountryData calling ${url} for ${country.name} (${country.id})`);

        return this.http.post<ICountry>(url, country)
            .map((result) => {
                this.log.info(`AngelsService saveCountryData saved country data for ${country.name} (${country.id}) to ${url}`);
                return result;
            })
            .catch(this.handleError);

    }

    getHospitals = (country: ICountry): Observable<IHospital[]> => {
        this.log.info(`AngelsService getHospitals called for ${country.name} (${country.id})`);

        if (this._hospitals.has(country.id)) {
            this.log.info(`AngelsService getHospitals ${country.name} (${country.id}) hospitals found in cache.`);
            return this._hospitals.get(country.id);
        }

        const url = hospitalsUrl + country.id;

        return this._hospitals.set(country.id, this.http.get<IHospital[]>(url)
            .do(hospitals => {
                this.log.info(`AngelsService getHospitals returned ${hospitals.length} hopitals`)
            })
            .publishReplay(1)
            .refCount())
            .get(country.id)
            .catch(this.handleError);
    }

    saveHospitalData = (hospital: IHospital): Observable<IHospital> => {
        this.log.info(`AngelsService saveHospitalData called for ${hospital.name} (${hospital.id})`);

        const url = saveHospitalUrl + hospital.id;
        this.log.info(`AngelsService saveHospitalData saving ${hospital.name} (${hospital.id}) to ${url}`);
        return this.http.post<IHospital>(url, hospital)
            .do(h => {
                this.log.info(`AngelsService saveHospitalData Saved ${h.name} (${h.id}) to ${url}`);
            })
            .catch(this.handleError);
    }

    getHospitalRoutes(hospital: IHospital): Observable<IHospitalRoutes> {

        this.log.info(`AngelsService getHospitalRoutes called for ${hospital.name} (${hospital.id})`);
        if (this._hospitalRoutes.has(hospital.id)) {
            this.log.info(`AngelsService getHospitals ${hospital.name} (${hospital.id}) hospitals found in cache.`);
            return this._hospitalRoutes.get(hospital.id);
        }

        const url = hospitalUrl + hospital.id;

        return this._hospitalRoutes.set(hospital.id, this.http.get<IHospitalRoutes>(url)
            .publishReplay(1)
            .refCount())
            .get(hospital.id)
            .catch(this.handleError);
    }

    getCountryRoutes(country: ICountry): Observable<IHospitalRoutes[]> {

        this.log.info(`AngelsService getCountryRoutes called for ${country.name} (${country.id})`);
        if (this._countryRoutes.has(country.id)) {
            this.log.info(`AngelsService getHospitals ${country.name} (${country.id}) hospitals found in cache.`);
            return this._countryRoutes.get(country.id);
        }

        const url = routesUrl + country.id;

        return this._countryRoutes.set(country.id, this.http.get<IHospitalRoutes[]>(url)
            // .map(r => r.json())
            .publishReplay(1)
            .refCount())
            .get(country.id)
            .catch(this.handleError);
    }

    toggleTreatingNoAngels(hospital: IHospital): Observable<IHospital> {
        this.log.info(`AngelsService toggleTreatingNoAngels called for ${hospital.name} (${hospital.id})`);

        const url = toggleTreatingNoAngelsUrl + hospital.id;
        this.log.info(`AngelsService toggleTreatingNoAngelsUrl saving ${hospital.name} (${hospital.id}) to ${url}`);
        return this.http.post<IHospital>(url, hospital)
            .do(h => {
                this.log.info(`AngelsService saveHospitalData Saved ${h.name} (${h.id}) to ${url}`);
            })
            .catch(this.handleError);
    }

    toggleFutureTarget(hospital: IHospital): Observable<IHospital> {
        this.log.info(`AngelsService toggleFutureTarget called for ${hospital.name} (${hospital.id})`);

        const url = toggleFutureTargetUrl + hospital.id;
        this.log.info(`AngelsService toggleFutureTargetUrl saving ${hospital.name} (${hospital.id}) to ${url}`);
        return this.http.post<IHospital>(url, hospital)
            .do(h => {
                this.log.info(`AngelsService toggleFutureTarget Saved ${h.name} (${h.id}) to ${url}`);
            })
            .catch(this.handleError);
    }


}
