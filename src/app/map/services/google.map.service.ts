import { Injectable } from '@angular/core';

import { } from '@types/googlemaps';

import { IMapService } from '../abstractions/imap.service';
import { IMapOptions } from '../abstractions/imap.options';
import { IMarkerOptions } from '../abstractions/imarker.options';

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

    directions(request: google.maps.DirectionsRequest): Promise<google.maps.DirectionsResult> {
        const _me = this;
        return new Promise(function (res, rej) {
            _me.dirService.route(request, function (result, status) {
                switch (status) {
                    case google.maps.DirectionsStatus.OK: return res(result);
                    case google.maps.DirectionsStatus.NOT_FOUND: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.ZERO_RESULTS: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    case google.maps.DirectionsStatus.REQUEST_DENIED:
                        return rej([{ result: result, status: status }]);
                    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                        // We should retry.. Retry service impl todo
                        return rej([{ result: result, status: status }]);

                    default:
                        return rej({ result: result, status: status });

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

    getMarker(location: google.maps.LatLng, options: IMarkerOptions): google.maps.Marker {
        const newopts: google.maps.MarkerOptions = {
            position: location,
            icon: options.icon,
            title: options.title
        };

        const marker = new google.maps.Marker(newopts);

        if (options.onClick) {
            google.maps.event.addListener(marker, 'click', function (args, e) {
                options.onClick.apply(this, [{ marker: marker, args: args }])
            });
        }

        return marker;
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

    drawDrivingRadius(marker: google.maps.Marker, radius: number): void {
        const searchPoints = this.getSearchPoints(marker, radius);
        const _me = this;
        Promise.all(this.getDirections(marker.getPosition(), searchPoints))
            .then((results) => {
                const lines = this.drawRoutes(results);
                const endpoints = lines.filter((line: google.maps.Polyline[]): google.maps.Polyline => {
                    return line.length === 0 ? undefined : line[0];
                }).map<google.maps.LatLng>((l) => {
                    const path: google.maps.LatLng[] = l[0].getPath().getArray();
                    const lastPoint = path[path.length - 1];
                    return this.getLocation(lastPoint.lat(), lastPoint.lng());
                });

                const shape = new google.maps.Polygon({
                    paths: endpoints,
                    strokeColor: 'green',
                    strokeWeight: 1,
                    strokeOpacity: 0.2,
                    fillColor: 'green',
                    fillOpacity: 0.2
                });

                shape.setMap(_me.map);
            })
            .catch((err) => {
                throw err;
            })
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

    private getSearchPoints(marker: google.maps.Marker, radius: number): google.maps.LatLng[] {
        const center: google.maps.LatLng = marker.getPosition();
        const searchPoints = [];
        const rLat = (radius / 3963.189) * (180 / Math.PI); // miles
        const rLng = rLat / Math.cos(center.lat() * (Math.PI / 180));
        for (let a = 0; a < 360; a = a + 45) {
            const aRad = a * (Math.PI / 180);
            const x = center.lng() + (rLng * Math.cos(aRad));
            const y = center.lat() + (rLat * Math.sin(aRad));
            const point = new google.maps.LatLng(y, x, true);
            searchPoints.push(point);
        }
        return searchPoints;
    }

    private getDirections(center: google.maps.LatLng, searchPoints: google.maps.LatLng[]): Promise<google.maps.DirectionsResult>[] {
        const routes: google.maps.DirectionsResult[] = [];

        return searchPoints.map((s, i) => {
            const req: google.maps.DirectionsRequest = {
                travelMode: google.maps.TravelMode.DRIVING,
                origin: center,
                destination: s
            };

            return this.directions(req);
        })
    };

    private drawRoutes(routes: google.maps.DirectionsResult[]): google.maps.Polyline[][] {

        if (!routes) {
            return [];
        }

        return routes.map<google.maps.Polyline[]>((directions: google.maps.DirectionsResult) => {
            if (!directions) {
                return [];
            }
            const paths = []

            return directions.routes.map<google.maps.Polyline>((rr: google.maps.DirectionsRoute, i) => {
                const opath = rr.overview_path;
                const legs = rr.legs;
                let duration = 0;

                rr.legs.map((leg) => {
                    leg.steps.map((step) => {
                        if (duration < 1800) {
                            step.path.map((path) => paths.push(path));
                        }
                        duration = duration + step.duration.value;
                    });
                });

                const newLine = new google.maps.Polyline({
                    path: paths,
                    strokeColor: '#ff0000',
                    strokeWeight: 2,
                    strokeOpacity: 1
                });

                newLine.setMap(this.map)
                return newLine;
            });
        });
    }
}
