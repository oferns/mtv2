export interface IMapService {
    initMap(mapElement: HTMLElement, options: any): Promise<any>;
    onReady(): Promise<void>;
    directions(searchPoints: any): Promise<any[]>;
    getLocation(lat: number, lng: number): any;
    setCenter(lat: number, lng: number): any;
    setBounds(bounds: any): void;
    setZoom(zoom: number): void;
    addListener(event: string, handler: (...args: any[]) => void): void;
    geocode(addressObj: Object): Promise<any[]>;
    setMarker(marker: any): any;
    getMarker(bounds: any): any;
    removeMarker(marker: any): any;
}
