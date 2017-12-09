import { IRouteStep } from '../map/abstractions/iroutestep';
import { Observable } from 'rxjs/Observable';
import { IHospitalRoutes } from '../data/ihospitalroutes';

export interface IHospital {
    id: number;
    name: string;
    address: string;
    city: string;
    postcode: string;
    country: number;
    lat: number;
    lng: number;
    strokeReady: boolean;
    treatingNoAngels: boolean;
    consulting: boolean;    
    representative: string;
    visible?: boolean;
    inView?: boolean;
    routes?: Observable<IHospitalRoutes>;
}
