
import { IGeoCodeResult } from './igeocode.result';
import { IMapOptions } from '../abstractions/imap.options';
import { IRouteStep } from '../abstractions/iroutestep';

import { IMarkerOptions } from '../abstractions/imarker.options';
import { IDirectionsService } from '../abstractions/idirections.service'
import { IDirectionsRequest } from '../abstractions/idirections.request';

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
    addListener(event: string, handler: (...args: Array<any>) => void): any;
    addListenerOnce(event: string, handler: (...args: Array<any>) => void): any;
    removeListener(handle: any): void;
    clearListeners(event?: string): void;
    geocode(location: string | any): Promise<Array<IGeoCodeResult>>;
    setMarker(marker: any, visible: boolean): any;
    getMarker(location: any, options: IMarkerOptions): any;
    toggleMarker(marker: any, visible: boolean): any;
    removeMarker(marker: any): any;
    removeMarkers(): Array<any>;
    getOptions(options: IMapOptions): any;
    getPoint(x: number, y: number): any;
    getDirectionsRequest(request: IDirectionsRequest): any;
    getRadialPoints(location: any, points: number, miles: number): Array<any>;
    getRoutesAsPaths(routes: Array<any>, seconds: number): Array<Array<any>>

    getDirectionAsRouteSteps(direction: any): Array<any>;
    getDirectionsAsRouteSteps(directions: Array<any>): Array<Array<any>>;
    shortenRouteStepsByDuration(routeSteps: Array<IRouteStep>, durationInSeconds: number): Array<any>;

    getShapeOptions(options: any): any;
    getShape(points: Array<any>, options: any): any;
    setShape(shape: any, visible: boolean): any;
    toggleShape(shape: any, visible: boolean): any;
    removeShape(shape: any): any;
    removeShapes(): void;
    getConvexHull(points: Array<any>): Array<any>;
    getLineOptions(any): any;
    getLine(path: any, options: any): any;
    setLine(line: any, visible: boolean): any;
    toggleLine(line: any, visible: boolean): any;
    removeLine(line: any): any;
    removeLines(): void;
}
