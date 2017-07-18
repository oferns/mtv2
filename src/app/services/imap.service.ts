export interface IMapService {
    initMap(mapElement: HTMLElement, options: any): Promise<any>;
    onReady(): Promise<void>;
    directions(searchPoints: any): Promise<Object[]>;
    getLocation(lng: number, lat: number): any;
    setCenter(map: any, lng: number, lat: number): any;
}
