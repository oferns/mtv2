import { IGeoCodeResult } from './igeocode.result';
import { IMapOptions } from '../abstractions/imap.options';

export interface IMapService {
    provider: string;
    initMap(mapElement: HTMLElement, options: any): Promise<any>;
    onReady(): Promise<void>;
    directions(searchPoints: any): Promise<any[]>;
    getLocation(lat: number, lng: number): any;
    setCenter(lat: number, lng: number): any;
    getCenter(): any;
    setBounds(bounds: any): void;
    getBounds(): any;
    getBoundsObj(nw: any, se: any): any;
    setZoom(zoom: number): void;
    addListener(event: string, handler: (...args: any[]) => void): void;
    geocode(location: string | any): Promise<IGeoCodeResult[]>;
    setMarker(marker: any): any;
    getMarker(lat: number, lng: number, options: any): any;
    removeMarker(marker: any): any;
    getOptions(options: IMapOptions): any;
}
