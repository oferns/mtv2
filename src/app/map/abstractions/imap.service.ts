
import { IGeoCodeResult } from './igeocode.result';
import { IMapOptions } from '../abstractions/imap.options';
import { IMarkerOptions } from '../abstractions/imarker.options';


export interface IMapService {
    provider: string;
    initMap(mapElement: HTMLElement, options: any): Promise<any>;
    onReady(): Promise<void>;
    directions(searchPoints: any): Promise<any>;
    getLocation(lat: number, lng: number): any;
    setCenter(location: any): any;
    getCenter(): any;
    setBounds(bounds: any): void;
    getBounds(): any;
    getBoundsObj(nw: any, se: any): any;
    setZoom(zoom: number): void;
    addListener(event: string, handler: (...args: any[]) => void): void;
    geocode(location: string | any): Promise<IGeoCodeResult[]>;
    setMarker(marker: any): any;
    getMarker(location: any, options: IMarkerOptions): any;
    removeMarker(marker: any): any;
    removeMarkers(): any[];
    getOptions(options: IMapOptions): any;

    getRadialPoints(marker: any, points: number, miles: number): Array<any>;
    drawDrivingRadius(marker: any, radius: number): void;
    getRoutesAsPaths(routes: Array<any>, seconds: number): Array<Array<any>>

    getDirectionsAsPaths(routes: Array<any>): Array<Array<any>>
}
