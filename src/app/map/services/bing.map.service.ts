import { } from '@types/bingmaps';

import { IMapService } from '../../services/imap.service';
import { env } from '../../../env/env';


declare var Microsoft: any;

export class BingMapService implements IMapService {

    private map: Microsoft.Maps.Map;
    private scriptLoadingPromise: Promise<void>;

    constructor() {
        const script: HTMLScriptElement = window.document.createElement('script');
        const callback = 'cb';

        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `//www.bing.com/api/maps/mapcontrol?callback=${callback}`;

        this.scriptLoadingPromise = new Promise<void>((resolve: Function, reject: Function) => {
            (<any>window)[callback] = () => { resolve(); };

            script.onerror = (error: Event) => { reject(error); };
        });

        window.document.body.appendChild(script);

        this.onReady().then(() => {
            // this.geocoder = new google.maps.Geocoder();
            // this.dirService = new google.maps.DirectionsService();
        });
    }

    onReady(): Promise<void> {
        return this.scriptLoadingPromise;
    }

    initMap(mapElement: HTMLElement, options: any): Promise<Microsoft.Maps.Map> {
        return this.onReady().then(() => {
            options.credentials = env.BM_API_KEY;
            return this.map = new Microsoft.Maps.Map(mapElement, options);
        });
    }

    directions(searchPoints: any): Promise<Object[]> {
        return new Promise(function (res, rj) {
            return res();
        });
    }

    getLocation(lat: number, lng: number): any {
        return new Microsoft.Maps.Location(lat, lng);
    }

    setCenter(map: Microsoft.Maps.Map, lat: number, lng: number): any {
        const center = this.getLocation(lat, lng);
        map.setView({
            center: center
        });
    }
}
