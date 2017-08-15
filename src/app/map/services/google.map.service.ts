import { Injectable } from '@angular/core';

import { Logger } from 'angular2-logger/core';
import { } from '@types/googlemaps';

import { IRouteStep } from '../abstractions/iroutestep';
import { IMapService } from '../abstractions/imap.service';
import { IMapOptions } from '../abstractions/imap.options';
import { IMarkerOptions } from '../abstractions/imarker.options';
import { IGeoCodeResult } from '../abstractions/igeocode.result';
import { IDirectionsRequest } from '../abstractions/idirections.request';
import { env } from '../../../env/env';

declare var google: any;

@Injectable()
export class GoogleMapService implements IMapService {

    private map: google.maps.Map;
    private scriptLoadingPromise: Promise<void>;
    private geocoder: google.maps.Geocoder;
    private dirService: google.maps.DirectionsService;

    // Internal tracking of objects. GM doesnt do this for us
    private _markers: Array<google.maps.Marker> = new Array<google.maps.Marker>();
    private _shapes: Array<google.maps.Polygon> = new Array<google.maps.Polygon>();
    private _lines: Array<google.maps.Polyline> = new Array<google.maps.Polyline>();

    public provider = 'Google';

    constructor(private readonly log: Logger) {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `//maps.googleapis.com/maps/api/js?key=${env.GM_API_KEY}&callback=${this.provider}&libraries=geometry,drawing`;

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
        });
    }

    async onReady(): Promise<void> {
        return await this.scriptLoadingPromise;
    }

    async initMap(mapElement: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
        return await this.onReady().then(() => {
            this.map = new google.maps.Map(mapElement, options);
            this.map.addListener('zoom_changed', () => google.maps.event.trigger(this.map, 'resize'));
            return this.map;
        });
    }

    getOptions(options: IMapOptions): google.maps.MapOptions {
        return new google.maps.MapOptions();
    }

    directions = async (request: google.maps.DirectionsRequest, retryCount?: number): Promise<google.maps.DirectionsResult> => {
        const _me = this;
        retryCount = retryCount || 0;
        const maxRetry = 10;

        if (!retryCount) {
            console.log(`Getting directions to ${request.destination}`);
        }

        return await new Promise<google.maps.DirectionsResult>(function (res, rej) {

            _me.dirService.route(request, function (result, status) {
                switch (status) {
                    case google.maps.DirectionsStatus.OK: return res(result);
                    case google.maps.DirectionsStatus.NOT_FOUND: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.ZERO_RESULTS: return res(<google.maps.DirectionsResult>null);
                    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                        if (retryCount < maxRetry) {
                            setTimeout(async () => {
                                _me.log.info(`${request.destination}: Retrying no ${retryCount} of ${maxRetry}
                                 after status of ${status} with result of ${result}`);
                                return await res(_me.directions(request, ++retryCount));
                            }, 2000);
                        } else {
                            return rej([{ result: result, status: status }])
                        } break;
                    case google.maps.DirectionsStatus.REQUEST_DENIED:
                        return rej([{ result: result, status: status }]);
                    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                        if (retryCount < maxRetry) {
                            setTimeout(async () => {
                                _me.log.info(`${request.destination}: Retrying no ${retryCount} of ${maxRetry}
                                after status of ${status} with result of ${result}`);
                                return await res(_me.directions(request, ++retryCount));
                            }, 2000);
                        } else {
                            return rej([{ result: result, status: status }])
                        } break;
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
        google.maps.event.addListener(this.map, event, handler);
    }

    setBounds(bounds: google.maps.LatLngBoundsLiteral): void {
        this.map.fitBounds(bounds);
    }

    getBounds(): google.maps.LatLngBounds {
        return this.map.getBounds();
    }

    getBoundsObj(nw: google.maps.LatLng, se: google.maps.LatLng): google.maps.LatLngBounds {
        return new google.maps.LatLngBounds(nw, se)
    }

    geocode = async (location: string | google.maps.LatLng | google.maps.LatLngBounds, retryCount?: number):
        Promise<Array<IGeoCodeResult>> => {
        const _me = this;
        retryCount = retryCount || 0;
        return await new Promise<Array<IGeoCodeResult>>((res, rej) => {
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
                (results: Array<google.maps.GeocoderResult>, status: google.maps.GeocoderStatus) => {
                    switch (status) {
                        case google.maps.GeocoderStatus.OK: return res(_me.convertGeoResults(results));
                        case google.maps.GeocoderStatus.ZERO_RESULTS: return res([]);
                        case google.maps.GeocoderStatus.ERROR: return rej(results);
                        case google.maps.GeocoderStatus.INVALID_REQUEST: return rej(results);
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                            if (retryCount < maxRetry) {
                                setTimeout(async () => {
                                    _me.log.info(`${location}: Retrying no ${retryCount} of ${maxRetry}
                               after status of ${status} with result of ${results}`);
                                    return await res(_me.geocode(location, ++retryCount));
                                }, 500);
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

    getLineOptions(options: any): google.maps.PolylineOptions {
        const newoptions: google.maps.PolylineOptions = {
            strokeColor: '#ff0000',
            strokeWeight: 2,
            strokeOpacity: 1
        };

        return newoptions;
    }

    getLine(path: Array<google.maps.LatLng>, options: google.maps.PolylineOptions): google.maps.Polyline {
        options.path = path;
        const line = new google.maps.Polyline(options);
        this._lines.push(line);
        return line;
    }


    drawLine(line: google.maps.Polyline): google.maps.Polyline {

        if (this._lines.indexOf(line) === -1) {
            this._lines.push(line);
        }
        console.log('Drawing ' + line);
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
    getRadialPoints(location: google.maps.LatLng, points: number, miles: number): Array<google.maps.LatLng> {
        const radialPoints = [];
        points = points > 1 ? Math.floor(360 / points) : 4;
        const rLat = (miles / 3963.189) * (180 / Math.PI); // miles
        const rLng = rLat / Math.cos(location.lat() * (Math.PI / 180));
        for (let a = 0; a <= 360; a = a + points) {
            const aRad = a * (Math.PI / 180);
            const x = location.lng() + (rLng * Math.cos(aRad));
            const y = location.lat() + (rLat * Math.sin(aRad));
            const point = new google.maps.LatLng(y, x, true);
            radialPoints.push(point);
        }
        return radialPoints;
    }

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

    shortenRouteStepsByDuration(routeSteps: Array<IRouteStep>, durationInSeconds: number): Array<google.maps.LatLng> {
        let totalDuration = 0;
        let results: Array<google.maps.LatLng> = [];
        let x = 0;

        while (x < routeSteps.length && totalDuration < durationInSeconds) {
            const step = routeSteps[x];
            const points = google.maps.geometry.encoding.decodePath(step.encoded_lat_lngs);
            if (totalDuration + step.durationInSeconds > durationInSeconds) {

                const secondsneeded = Math.max(durationInSeconds - totalDuration, totalDuration);
                const percentageOfTotal = (secondsneeded / step.durationInSeconds) * 100;
                const lastPoint = ((points.length / 100) * percentageOfTotal);

                results = results.concat(points.filter((p, i: number) => i <= lastPoint));

            } else {
                results = results.concat(points);
            }
            totalDuration += step.durationInSeconds;
            ++x;
        }

        return results;
    }

    shortenRouteStepsByLength(routeSteps: Array<IRouteStep>, distanceInMeters: number): Array<google.maps.LatLng> {
        let totalDistance = 0;
        let results: Array<google.maps.LatLng> = [];
        let x = 0;

        while (x < routeSteps.length && totalDistance < distanceInMeters) {
            const step = routeSteps[x];
            const points = google.maps.geometry.encoding.decodePath(step.encoded_lat_lngs);
            if (totalDistance + step.durationInSeconds > distanceInMeters) {

                const secondsneeded = Math.max(distanceInMeters - totalDistance, totalDistance);
                const percentageOfTotal = (secondsneeded / step.durationInSeconds) * 100;
                const lastPoint = ((points.length / 100) * percentageOfTotal);

                results = results.concat(points.filter((p, i: number) => i <= lastPoint));

            } else {
                results = results.concat(points);
            }
            totalDistance += step.durationInSeconds;
            ++x;
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


    // Takes an individual Direction step and converts it to a flat array of IRouteSteps
    getDirectionAsRouteSteps(directions: google.maps.DirectionsResult): Array<IRouteStep> {
        if (!directions) {
            return new Array<IRouteStep>();
        }

        const routes = directions.routes.map<Array<IRouteStep>>((route: google.maps.DirectionsRoute) => {
            const legs = route.legs.map<Array<IRouteStep>>((leg: google.maps.DirectionsLeg) => {
                return leg.steps.map<IRouteStep>((step: google.maps.DirectionsStep) => {
                    return <IRouteStep>{
                        encoded_lat_lngs: step['encoded_lat_lngs'], // For some reason this isnt in the type definitions
                        durationInSeconds: step.duration.value,
                        distanceInMeters: step.distance.value
                    };
                });
            });
            return <Array<IRouteStep>>legs.reduce((a, b) => a.concat(b));
        });
        return <Array<IRouteStep>>routes.reduce((a, b) => a.concat(b)).filter((rs) => rs);
    }

    // Returns a flattened array of IRouteSteps for each route in the DirectionsResult
    getDirectionsAsRouteSteps(directions: Array<google.maps.DirectionsResult>): Array<Array<IRouteStep>> {
        if (!directions) {
            return;
        }
        return directions.map<Array<IRouteStep>>((direction: google.maps.DirectionsResult) => {
            if (!direction) {
                return;
            }
            const routes = direction.routes.map<Array<IRouteStep>>((route: google.maps.DirectionsRoute) => {
                const legs = route.legs.map<Array<IRouteStep>>((leg: google.maps.DirectionsLeg) => {
                    return leg.steps.map<IRouteStep>((step: google.maps.DirectionsStep) => {
                        return <IRouteStep>{
                            encoded_lat_lngs: step['encoded_lat_lngs'],
                            durationInSeconds: step.duration.value, distanceInMeters: step.distance.value
                        };
                    });
                });
                return <Array<IRouteStep>>legs.reduce((a, b) => a.concat(b));
            });
            return <Array<IRouteStep>>routes.reduce((a, b) => a.concat(b));
        }).filter((r) => r);
    };

    getConvexHull(points: Array<google.maps.LatLng>): Array<google.maps.LatLng> {

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

    getDirectionsRequest(request: IDirectionsRequest): google.maps.DirectionsRequest {
        return new google.maps.DirectionsRequest(request);
    }

    private cross(a: google.maps.LatLng, b: google.maps.LatLng, o: google.maps.LatLng): number {
        return (a.lat() - o.lat()) * (b.lng() - o.lng()) - (a.lng() - o.lng()) * (b.lat() - o.lat());
    }
}
