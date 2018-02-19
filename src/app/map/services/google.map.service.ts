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
import { } from '../../../../ext/markerclusterer.js'

declare var google: any;
declare var MarkerClusterer: any;

@Injectable()
export class GoogleMapService implements IMapService {

    private map: google.maps.Map;
    private scriptLoadingPromise: Promise<void>;
    private geocoder: google.maps.Geocoder;
    private dirService: google.maps.DirectionsService;
    private cluster: any;
    public provider = 'Google';

    constructor(private readonly log: Logger) {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.type = 'text/javascript';
        script.async = true;
        script.defer = true;
        script.src = `//maps.googleapis.com/maps/api/js?key=${env.GM_API_KEY}&v=3&callback=${this.provider}&libraries=geometry,drawing`;

        this.scriptLoadingPromise = new Promise<void>((res: Function, rej: Function) => {
            (<any>window)[this.provider] = (a) => {
                res();
            };

            script.onerror = (error: Event) => {
                rej(error);
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

            setTimeout(() => {
                this.cluster = new MarkerClusterer(this.map, null, {
                    imagePath: 'assets/img/m',
                    minimumClusterSize: 1,
                    averageCenter: true,
                    zoomOnClick: true,
                    maxZoom: 8
                });

            }, 0)

            // this.map.addListener('zoom_changed', () => google.maps.event.trigger(this.map, 'resize'));
            return this.map;
        });
    }

    getOptions(options: IMapOptions): google.maps.MapOptions {
        return {
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            // zoom: zoom,
            // center: center,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            mapTypeControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: false
        };
    }

    directions = async (request: google.maps.DirectionsRequest, retryCount?: number): Promise<google.maps.DirectionsResult> => {
        const _me = this;
        retryCount = retryCount || 0;
        const maxRetry = 10;

        if (!retryCount) {
            this.log.info(`Getting directions to ${request.destination}`);
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
        this.map.panTo(location);
        return location;
    }

    getCenter(): google.maps.LatLng {
        return this.map.getCenter();
    }

    setZoom(zoom: number): void {
        this.map.setZoom(zoom);
    }

    addListener(event: string, handler: (...args: any[]) => void): google.maps.MapsEventListener {
        return google.maps.event.addListener(this.map, event, handler);
    }

    addListenerOnce(event: string, handler: (...args: any[]) => void): google.maps.MapsEventListener {
        return google.maps.event.addListenerOnce(this.map, event, handler);
    }

    removeListener(handle: google.maps.MapsEventListener): void {
        google.maps.event.removeListener(handle);
    }

    clearListeners(event?: string): void {
        if (event) {
            google.maps.event.clearListeners(this.map, event)
        } else {
            google.maps.event.clearInstanceListeners(this.map);
        }
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

    setMarker(marker: google.maps.Marker, visible: boolean): google.maps.Marker {
        marker.setVisible(visible);
        marker.setMap(this.map);
        return marker;
    };
    toggleMarker(marker: google.maps.Marker, visible: boolean): google.maps.Marker {
        marker.setVisible(visible);
        return marker;
    }

    getMarker(location: google.maps.LatLng, options: IMarkerOptions): google.maps.Marker {

        const newopts: google.maps.MarkerOptions = {
            position: location,
            icon: options.icon,
            title: options.title
        };

        const marker = new google.maps.Marker(newopts);

        if (options.onClick) {
            google.maps.event.addListener(marker, 'click', function (args, e) {
                options.onClick.apply(this, [{ marker: marker, args: args, id: options.id }])
            });
        }

        return marker;
    };

    getInfoWindowOptions(location: google.maps.LatLng): google.maps.InfoWindowOptions {
        return {
            position: location
        };
    }
    getInfoWindow(options: google.maps.InfoWindowOptions): google.maps.InfoWindow {
        return new google.maps.InfoWindow(options);
    }

    setInfoWindow(window: google.maps.InfoWindow): google.maps.InfoWindow {
        window.open(this.map);
        return window;
    }

    removeMarker(marker: google.maps.Marker): google.maps.Marker {
        marker.setMap(null);
        return marker;
    };

    removeMarkers(): google.maps.Marker[] {

        return [];
    }

    clusterMarkers(markers: Array<google.maps.Marker>, redraw: boolean): void {
        this.cluster.addMarkers(markers, redraw);
        this.cluster.repaint();
    }

    removeClusters() {
        this.cluster.clearMarkers();
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
        line.setMap(this.map);
        return line;
    }

    setLine(line: google.maps.Polyline, visible = true): google.maps.Polyline {
        line.setVisible(visible);
        if (!line.getMap()) {
            line.setMap(this.map);
        }
        return line;
    }
    toggleLine(line: google.maps.Polyline, visible = true): google.maps.Polyline {
        line.setVisible(visible);
        return line;
    }

    hideLine(line: google.maps.Polyline): google.maps.Polyline {
        line.setVisible(false);
        return line;
    }

    removeLine(line: google.maps.Polyline): void {
        line.setMap(null);
        line = null;
    }

    removeLines(): void {

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
        return shape;
    }

    setShape(shape: google.maps.Polygon, visible = true): google.maps.Polygon {
        shape.setVisible(visible)
        if (!shape.getMap()) {
            shape.setMap(this.map);
        }
        return shape;
    }

    toggleShape(shape: google.maps.Polygon, visible = true): google.maps.Polygon {
        shape.setVisible(visible);
        return shape;
    }

    removeShape(shape: google.maps.Polygon): void {
        shape.setMap(null);
        shape = null;
    }

    removeShapes(): void {

    }

    getPoint(x: number, y: number): google.maps.Point {
        return new google.maps.Point(x, y);
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
                const t1 = totalDuration + step.durationInSeconds;
                const t2 =  t1 - durationInSeconds;
                const t3 = step.durationInSeconds - t2;

                // const secondsneeded = Math.max(durationInSeconds - totalDuration, totalDuration);
                const percentageOfTotal = (t3 / step.durationInSeconds) * 100;
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
