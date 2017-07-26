import { IMarkerOptions } from '../abstractions/imarker.options';

export interface IDrawingService {

    setMarker(marker: any): any;
    getMarker(location: any, options: IMarkerOptions): any;
    removeMarker(marker: any): any;
    removeMarkers(): any[];

    getLineOptions(any): any;
    getLine(points: Array<any>): any;
    drawLine(line: any): any;
    removeLine(line: any): any;
    removeLines(): void;

    getShape(points: Array<any>): any;
    drawShape(shape: any): any;
    removeShape(shape: any): any;
    removeShapes(): void;

    getCircle(center: any): any;
    drawCircle(circle: any): any;
    removeCircle(circle: any): any;
    removeCircles(): void;

    getConvexHull(points: Array<any>): Array<any>;

}
