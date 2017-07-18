import { } from '@types/bingmaps';
import { } from '@types/bingmaps/search';

import { IMapService } from '../../services/imap.service';
import { env } from '../../../env/env';


declare var Microsoft: any;

export class BingMapService implements IMapService {

    private map: Microsoft.Maps.Map;
    private searchManager: any;
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
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', () => {
                this.searchManager = new Microsoft.Maps.Search.SearchManager(this.map);
            })
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

    getLocation(lat: number, lng: number): Microsoft.Maps.Location {
        return new Microsoft.Maps.Location(lat, lng);
    }

    setCenter(lat: number, lng: number): Microsoft.Maps.Location {
        const center = this.getLocation(lat, lng);
        this.map.setView({
            center: center
        });
        return center;
    }

    setZoom(zoom: number): void {
        this.map.setView({
            zoom: zoom
        });
    }

    setBounds(points: Object[]): void {

    }

    addListener(event: string, handler: (...args: any[]) => void): void {
        Microsoft.Maps.Events.addHandler(this.map, event, handler)
    }

    geocode(address: Object): Promise<Object[]> {
        return new Promise((res, rej) => {
            return res(this.searchManager.geocode(address));
        });
    }

    setMarker(marker: Microsoft.Maps.Pushpin): Microsoft.Maps.Pushpin {
        this.map.entities.push(marker);
        return marker;
    };

    getMarker(options: any): Microsoft.Maps.Pushpin {
        return new Microsoft.Maps.Pushpin(options.bounds, options);
    };

    removeMarker(marker: Microsoft.Maps.Pushpin): Microsoft.Maps.Pushpin {
        this.map.entities.remove(marker);
        return marker;
    };
}
