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

    // Internal tracking of objects. GM doesnt do this for us
    private _markers: google.maps.Marker[] = [];
    private _shapes: google.maps.Polygon[] = [];
    private _lines: google.maps.Polyline[] = [];
    provider = 'Google';

    wank = 'er';

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

    async directions(request: google.maps.DirectionsRequest, retryCount?: number): Promise<google.maps.DirectionsResult> {
        const _me = this;
        retryCount = retryCount || 0;
        return await new Promise<google.maps.DirectionsResult>(function (res, rej) {
            const maxRetry = 10;

            _me.dirService.route(request, function (result, status) {
                switch (status) {
                    case google.maps.DirectionsStatus.OK: return res(result);
                    case google.maps.DirectionsStatus.NOT_FOUND: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.ZERO_RESULTS: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                        if (retryCount <= maxRetry) {
                            setTimeout(() => {
                                console.log(`Retrying no ${retryCount} of ${maxRetry}`);
                                return res(_me.directions(request, ++retryCount));
                            }, 2000);
                        } else {
                            return rej([{ result: result, status: status }])
                        } break;
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

    async geocode(location: string | google.maps.LatLng | google.maps.LatLngBounds, retryCount?: number): Promise<IGeoCodeResult[]> {
        const _me = this;
        retryCount = retryCount || 0;
        return await new Promise<IGeoCodeResult[]>((res, rej) => {
            const options: google.maps.GeocoderRequest = {};

            if (typeof location === 'string') {
                options.address = location;
            } else if (location instanceof google.maps.LatLng) {
                options.location = <google.maps.LatLng>location;
            } else if (location instanceof google.maps.LatLngBounds) {
                options.bounds = <google.maps.LatLngBounds>location;
            }

            const maxRetry = 10;

            _me.geocoder.geocode(options,
                (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
                    switch (status) {
                        case google.maps.GeocoderStatus.OK: return res(_me.convertGeoResults(results));
                        case google.maps.GeocoderStatus.ZERO_RESULTS: return res([]);
                        case google.maps.GeocoderStatus.ERROR: return rej(results);
                        case google.maps.GeocoderStatus.INVALID_REQUEST: return rej(results);
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                            if (retryCount <= maxRetry) {
                                setTimeout(() => {
                                    console.log('Retrying');
                                    retryCount++;
                                    return _me.geocode(location);
                                }, 1000);
                            } else {
                                return rej(results)
                            } break;
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
            title: options.title,
        };

        const marker = new google.maps.Marker(newopts);
        marker.id = options.id;

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

    getLineOptions(options: any): google.maps.PolylineOptions {
        const newoptions: google.maps.PolylineOptions = {
            strokeColor: '#ff0000',
            strokeWeight: 2,
            strokeOpacity: 1
        };

        return newoptions;
    }

    getLine(path: google.maps.LatLng[], options: google.maps.PolylineOptions): google.maps.Polyline {
        options.path = path;
        const line = new google.maps.Polyline(options);
        this._lines.push(line);
        return line;
    }

    drawLine(line: google.maps.Polyline): google.maps.Polyline {

        if (this._lines.indexOf(line) === -1) {
            this._lines.push(line);
        }

        line.setMap(this.map);
        return line;
    }

    hideLine(line: google.maps.Polyline): google.maps.Polyline {
        if (this._lines.indexOf(line) === -1) {
            this._lines.push(line);
        }
        line.setMap(null);
        return line;
    }

    removeLine(line: google.maps.Polyline): void {
        const index = this._lines.indexOf(line);
        if (index > -1) {
            this._lines.splice(index, 1);
        }

        line.setMap(null);
        line = null;
    }

    removeLines(): void {
        let len = this._lines.length;
        while (len--) {
            this.removeLine(this._lines[len]);
        }
        this._lines = [];
    }

    getShapeOptions(options: any): google.maps.PolygonOptions {
        const newoptions: google.maps.PolygonOptions = {
            strokeColor: 'green',
            strokeWeight: 1,
            strokeOpacity: 0.2,
            fillColor: 'green',
            fillOpacity: 0.2
        };
        return newoptions;
    }

    getShape(paths: google.maps.LatLng[], options: google.maps.PolygonOptions): google.maps.Polygon {
        options.paths = paths;
        const shape = new google.maps.Polygon(options);
        this._shapes.push(shape);
        return shape;
    }

    drawShape(shape: google.maps.Polygon): google.maps.Polygon {
        if (this._shapes.indexOf(shape) === -1) {
            this._shapes.push(shape);
        }

        shape.setMap(this.map);
        return shape;
    }

    hideShape(shape: google.maps.Polygon): google.maps.Polygon {
        if (this._shapes.indexOf(shape) === -1) {
            this._shapes.push(shape);
        }
        shape.setMap(null);
        return shape;
    }

    removeShape(shape: google.maps.Polygon): void {
        const index = this._shapes.indexOf(shape);
        if (index > -1) {
            this._shapes.splice(index, 1);
        }

        shape.setMap(null);
        shape = null;
    }

    removeShapes(): void {
        let len = this._shapes.length;
        while (len--) {
            this.removeLine(this._shapes[len]);
        }
        this._shapes = [];
    }

    drawDrivingRadius(marker: google.maps.Marker, miles: number): void {
        const searchPoints = this.getRadialPoints(marker, 12, miles);
        const _me = this;
        Promise.all(this.getDirections(marker.getPosition(), searchPoints))
            .then((results) => {
                // Get rid of null routes (not found or no results)
                const routes = this.getRoutesAsPaths(results, 1800).filter((r) => r);

                // Flattens the route into an array of LatLngs
                const shapepoints = [].concat.apply([], routes.map((r) => [].concat.apply([], r)));

                // Get a set of points representing a convex hull
                const shapeLines = this.convexHull(shapepoints);

                const shapeoptions = this.getShapeOptions({});
                this.drawShape(this.getShape(shapeLines, shapeoptions));

                // Draw the Route lines
                routes.forEach((route) => {
                    const lineoptions = this.getLineOptions({});
                    const linepoints = [].concat.apply([], route);
                    this.drawLine(this.getLine(linepoints, lineoptions));
                })
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

    // Return
    getRadialPoints(marker: google.maps.Marker, points: number, miles: number): Array<google.maps.LatLng> {
        const center: google.maps.LatLng = marker.getPosition();
        const radialPoints = [];
        points = points > 1 ? Math.floor(360 / points) : 4;
        const rLat = (miles / 3963.189) * (180 / Math.PI); // miles
        const rLng = rLat / Math.cos(center.lat() * (Math.PI / 180));
        for (let a = 0; a <= 360; a = a + points) {
            const aRad = a * (Math.PI / 180);
            const x = center.lng() + (rLng * Math.cos(aRad));
            const y = center.lat() + (rLat * Math.sin(aRad));
            const point = new google.maps.LatLng(y, x, true);
            radialPoints.push(point);
        }
        return radialPoints;
    }

    // From Google
    private getDirections(center: google.maps.LatLng, searchPoints: google.maps.LatLng[]): Promise<google.maps.DirectionsResult>[] {

        return searchPoints.map((s, i) => {
            const req: google.maps.DirectionsRequest = {
                travelMode: google.maps.TravelMode.DRIVING,
                origin: center,
                destination: s
            };

            return this.directions(req);
        })
    };

    // This method takes a google DirectionsRoute and returns an array of LatLng points that
    // represent the route upto the amount of tume passed in seconds
    getRoutePathByDuration(route: google.maps.DirectionsRoute, seconds: number): Array<google.maps.LatLng> {
        let duration = 0;
        let results: Array<google.maps.LatLng> = [];
        let x = 0;

        while (duration < seconds && x < route.legs.length) {
            const leg = route.legs[x];
            for (let y = 0; y < leg.steps.length; y++) {
                if (duration > seconds) {
                    break;
                }
                const step = leg.steps[y];
                if ((duration + step.duration.value) > seconds) {
                    const secondsneeded = Math.max(seconds - duration, duration);
                    const percentageOfTotal = (secondsneeded / step.duration.value) * 100;
                    const lastpath = (step.path.length / 100) * percentageOfTotal;
                    results = results.concat(leg.steps[y].path.filter((l: google.maps.LatLng, i) => i < lastpath))
                } else {
                    results = results.concat(leg.steps[y].path);
                }
                duration = duration + step.duration.value;
            }
            x++;
        }
        return results;
    }

    // Returns an array of points for each route in the Directions
    getRoutesAsPaths(routes: google.maps.DirectionsResult[], seconds: number): Array<Array<google.maps.LatLng>> {

        if (!routes) {
            return null;
        }

        // For each direction result, return one array of points per leg
        return routes.map<google.maps.LatLng[]>((directions: google.maps.DirectionsResult): google.maps.LatLng[] => {
            if (!directions) {
                return null;
            }
            const routepoints: Array<Array<google.maps.LatLng>> = directions.routes.map<google.maps.LatLng[]>
                ((route: google.maps.DirectionsRoute): google.maps.LatLng[] => this.getRoutePathByDuration(route, seconds));

            return <google.maps.LatLng[]>[].concat.apply([], routepoints);
        });

    }

    // SHamelessly ripped from https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript
    private cross(a: google.maps.LatLng, b: google.maps.LatLng, o: google.maps.LatLng): number {
        return (a.lat() - o.lat()) * (b.lng() - o.lng()) - (a.lng() - o.lng()) * (b.lat() - o.lat());
    }

    private convexHull(points: google.maps.LatLng[]): google.maps.LatLng[] {

        points.sort((a: google.maps.LatLng, b: google.maps.LatLng) => a.lat() === b.lat() ? (a.lng() - b.lng()) : a.lat() - b.lat());

        const lower: google.maps.LatLng[] = [];
        const upper: google.maps.LatLng[] = [];

        for (let i = 0; i < points.length; i++) {
            while (lower.length >= 2 && this.cross(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0) {
                lower.pop();
            }
            lower.push(points[i]);
        }

        for (let i = points.length - 1; i >= 0; i--) {
            while (upper.length >= 2 && this.cross(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0) {
                upper.pop();
            }
            upper.push(points[i]);
        }

        upper.pop();
        lower.pop();
        return lower.concat(upper);
    }
}
