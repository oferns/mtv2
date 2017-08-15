import { ICountry } from '../data/icountry';
import { IHospital } from '../data/ihospital';
import { IHospitalRoutes } from 'app/data/ihospitalroutes';
import { IRouteStep } from '../map/abstractions/iroutestep';

import { Observable } from 'rxjs/Observable';

export interface IHcoService {
    getCountries(): Observable<Array<ICountry>>;
    getHospitals(country: ICountry): Observable<Array<IHospital>>;
    getHospitalRoutes(hospital: IHospital): Observable<IHospitalRoutes>;
    saveCountryData(country: ICountry): Promise<ICountry>;
    saveHospitalData(hospital: IHospital): Promise<IHospital>;
}
