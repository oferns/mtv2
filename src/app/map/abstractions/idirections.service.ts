import { IGeoCodeResult } from './igeocode.result';

export interface IDirectionsService {

    getDirections(request: any): Promise<any>;

    getGeocodeOptions(address: string, bounds?: any): any;
    geocode(request: any): Promise<IGeoCodeResult[]>;

    getReverseGeocodeOptions(location: google.maps.LatLng | google.maps.LatLngLiteral, bounds?: google.maps.LatLngBounds)
    reverseGeocode(request: any): Promise<IGeoCodeResult[]>;

    getRadialPoints(marker: any, points: number, miles: number): Array<any>;
    getDirectionsAsRouteSteps(directions: Array<any>): Array<Array<any>>
    shortenDirectionsAsPaths(routes: Array<any>, seconds: number): Array<Array<any>>

}
