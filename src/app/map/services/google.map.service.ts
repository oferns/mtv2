import { } from '@types/googlemaps';

import { IMapService } from '../../services/imap.service';
import { env } from '../../../env/env';

declare var google: any;

export class GoogleMapService implements IMapService {

    private map: google.maps.Map;
    private scriptLoadingPromise: Promise<void>;
    private geocoder: google.maps.Geocoder;
    private dirService: google.maps.DirectionsService;

    constructor() {
        const script: HTMLScriptElement = window.document.createElement('script');
        const callback = 'cb';

        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `//maps.googleapis.com/maps/api/js?key=${env.GM_API_KEY}&callback=${callback}`;

        this.scriptLoadingPromise = new Promise<void>((resolve: Function, reject: Function) => {
            (<any>window)[callback] = () => { resolve(); };

            script.onerror = (error: Event) => { reject(error); };
        });

        window.document.body.appendChild(script);

        this.onReady().then(() => {
            this.geocoder = new google.maps.Geocoder();
            this.dirService = new google.maps.DirectionsService();
        });
    }


    onReady(): Promise<void> {
        return this.scriptLoadingPromise;
    }

    initMap(mapElement: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
        return this.onReady().then(() => {
            return this.map = new google.maps.Map(mapElement, options);
        });
    }

    directions(searchPoints: google.maps.DirectionsRequest): Promise<Object[]> {

        return new Promise(function (res, rj) {
            this.dirService.route(searchPoints, function (result, status) {
                switch (status) {
                    case google.maps.DirectionsStatus.OK:
                        return res(result);
                    case google.maps.DirectionsStatus.NOT_FOUND:
                        break;
                    case google.maps.DirectionsStatus.ZERO_RESULTS:
                        break;
                    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    case google.maps.DirectionsStatus.REQUEST_DENIED:
                        break;
                    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                        // We should retry.. Retry service impl todo
                        break;

                    default:
                        break;
                }
            });
        });
    }

    getLocation(lat: number, lng: number): google.maps.LatLng {
        return new google.maps.LatLng(lat, lng);
    }

    setCenter(lat: number, lng: number): google.maps.LatLng {
        const center = this.getLocation(lat, lng);
        this.map.setCenter(center);
        return center;
    }

    setZoom(zoom: number): void {
        this.map.setZoom(zoom);
    }

    addListener(event: string, handler: (...args: any[]) => void): void {
        this.map.addListener(event, handler);
    }

    setBounds(bounds: google.maps.LatLngBounds): void {
        this.map.fitBounds(bounds);
        this.map.setCenter(bounds.getCenter());
    }

    geocode(address: Object): Promise<google.maps.GeocoderResult[]> {
        console.log('geocode called');
        return new Promise((res, rej) => {
            this.geocoder.geocode(address, (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
                return res(results);
            })
        });
    }
}
