import { ICountry } from '../data/icountry';
import { IHospital } from '../data/ihospital';
import { IHospitalRoutes } from 'app/data/ihospitalroutes';
import { IRouteStep } from '../map/abstractions/iroutestep';

import { Observable } from 'rxjs/Observable';

export interface IHcoService {
    getCountries(): Observable<ICountry[]>;
    getHospitals(country: ICountry): Observable<IHospital[]>;
    getHospitalRoutes(hospital: IHospital): Observable<IHospitalRoutes>;
    getCountryRoutes(country: ICountry): Observable<IHospitalRoutes[]>;
    saveCountryData(country: ICountry): Observable<ICountry>;
    saveHospitalData(hospital: IHospital): Observable<IHospital>;
    toggleStrokeReady(hospital: IHospital): Observable<IHospital>;
    toggleTreatingNoAngels(hospital: IHospital): Observable<IHospital>;
    toggleConsulting(hospital: IHospital): Observable<IHospital>;
    
}
