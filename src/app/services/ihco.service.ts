import { IHospital } from '../data/ihospital';
import { ICountry } from '../data/icountry';
import { IRouteStep } from '../map/abstractions/iroutestep';

export interface IHcoService {
    getCountries(): Promise<Array<ICountry>>;
    getHospitals(country_id: number): Promise<Array<IHospital>>;
    getHospital(hco_id: number): Promise<IHospital>;
    saveHospitalRoutes(hco_id: number, routeSteps: Array<Array<IRouteStep>>): Promise<Array<Array<IRouteStep>>>;
}
