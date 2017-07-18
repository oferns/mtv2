export interface IMapService {
    initMap(mapElement: HTMLElement, options: any): Promise<any>;
    onReady(): Promise<void>;
    directions(searchPoints: any): Promise<Object[]>;
    getLocation(lat: number, lng: number): any;
    setCenter(lat: number, lng: number): any;
    setZoom(zoom: number): void;
    addListener(event: string, handler: (...args: any[]) => void): void;
}
