import { IRouteStep } from '../map/abstractions/iroutestep';

export interface IHospital {
    id: number;
    name: string;
    address: string;
    city: string;
    postcode: string;
    country: number;
    lat: number;
    lng: number;
    strokeCenter: boolean;
    representative: string;
    visible?: boolean;
    radiusDirections?: Array<Array<IRouteStep>>;
}
