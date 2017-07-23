import { Injectable } from '@angular/core';

import { } from '@types/googlemaps';

import { IMapService } from '../abstractions/imap.service';
import { IMapOptions } from '../abstractions/imap.options';

import { IGeoCodeResult } from '../abstractions/igeocode.result';

import { env } from '../../../env/env';

declare var google: any;

@Injectable()
export class GoogleMapService implements IMapService {

    private map: google.maps.Map;
    private scriptLoadingPromise: Promise<void>;
    private geocoder: google.maps.Geocoder;
    private dirService: google.maps.DirectionsService;

    private _markers: google.maps.Marker[] = [];
    provider = 'Google';

    constructor() {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `//maps.googleapis.com/maps/api/js?key=${env.GM_API_KEY}&callback=${this.provider}`;

        this.scriptLoadingPromise = new Promise<void>((resolve: Function, reject: Function) => {
            (<any>window)[this.provider] = (a) => {
                resolve();
            };

            script.onerror = (error: Event) => {
                reject(error);
            };
        });

        window.document.body.appendChild(script);

        this.onReady().then(() => {
            this.geocoder = new google.maps.Geocoder();
            this.dirService = new google.maps.DirectionsService();
            // google.maps.event.addListener(this.map, 'idle', () => google.maps.event.trigger(this.map, 'resize'));
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

    getOptions(options: IMapOptions): google.maps.MapOptions {
        return new google.maps.MapOptions();
    }

    directions(searchPoints: google.maps.DirectionsRequest): Promise<object[]> {

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

    setCenter(location: google.maps.LatLng): google.maps.LatLng {
        this.map.setCenter(location);
        return location;
    }

    getCenter(): google.maps.LatLng {
        return this.map.getCenter();
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

    getBounds(): google.maps.LatLngBounds {
        return this.map.getBounds();
    }

    getBoundsObj(nw: google.maps.LatLng, se: google.maps.LatLng): google.maps.LatLngBounds {
        return new google.maps.LatLngBounds(nw, se)
    }

    private convertGeoResults(results: google.maps.GeocoderResult[]): IGeoCodeResult[] {
        return <IGeoCodeResult[]>results.map(function (r) {
            return {
                address: r.formatted_address,
                bounds: r.geometry.bounds,
                view: r.geometry.viewport,
                center: r.geometry.location,
                name: r.place_id
            };
        })
    }
    geocode(location: string | google.maps.LatLng | google.maps.LatLngBounds): Promise<IGeoCodeResult[]> {
        const options: google.maps.GeocoderRequest = {};

        if (typeof location === 'string') {
            options.address = location;
        } else if (location instanceof google.maps.LatLng) {
            options.location = <google.maps.LatLng>location;
        } else if (location instanceof google.maps.LatLngBounds) {
            options.bounds = <google.maps.LatLngBounds>location;
        }
        const _me = this;
        return new Promise((res, rej) => {
            _me.geocoder.geocode(options,
                (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
                    switch (status) {
                        case google.maps.GeocoderStatus.OK: return res(_me.convertGeoResults(results));
                        case google.maps.GeocoderStatus.ZERO_RESULTS: return res([]);
                        case google.maps.GeocoderStatus.ERROR: return rej(results);
                        case google.maps.GeocoderStatus.INVALID_REQUEST: return rej(results);
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT: return rej(results);
                        case google.maps.GeocoderStatus.UNKNOWN_ERROR:
                        default: return rej(results);
                    }
                });
        });
    }

    setMarker(marker: google.maps.Marker): google.maps.Marker {
        marker.setMap(this.map);
        this._markers.push(marker);
        return marker;
    };

    getMarker(lat: number, lng: number, options: google.maps.MarkerOptions): google.maps.Marker {
        options.position = this.getLocation(lat, lng);
        return new google.maps.Marker(options);
    };

    removeMarker(marker: google.maps.Marker): google.maps.Marker {
        marker.setMap(null);

        const i = this._markers.indexOf(marker)

        if (i > -1) {
            this._markers.splice(i, 1);
        }

        return marker;
    };

    removeMarkers(): google.maps.Marker[] {
        const markers = [];
        let len = this._markers.length;
        while (len--) {
            this._markers[len].setMap(null);
            markers.push(this._markers.splice(len, 1));
        }
        this._markers = [];
        return markers;
    }
}
