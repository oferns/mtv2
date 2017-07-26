import { Injectable } from '@angular/core';

import { } from '@types/googlemaps';

import { IRouteStep } from '../../abstractions/iroutestep';

import { IGeoCodeResult } from '../../abstractions/igeocode.result';
import { IDirectionsService } from '../../abstractions/idirections.service'

import { GoogleMapService } from '../../services/google.map.service';




declare var google: any;


@Injectable()
export class GoogleDirectionsService implements IDirectionsService {

    private directionsService: google.maps.DirectionsService;
    private geocoder: google.maps.Geocoder;

    constructor() {
        this.directionsService = new google.maps.DirectionsService();
        this.geocoder = new google.maps.Geocoder();
    }

    getDirections(request: any): Promise<google.maps.DirectionsResult> {
        return new Promise<google.maps.DirectionsResult>(function (res, rej) {
            this.dirService.route(request, function (result, status) {
                switch (status) {
                    case google.maps.DirectionsStatus.OK: return res(result);
                    case google.maps.DirectionsStatus.NOT_FOUND: return res(null);
                    case google.maps.DirectionsStatus.ZERO_RESULTS: return res(null);
                    case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
                    case google.maps.DirectionsStatus.REQUEST_DENIED:
                    case google.maps.DirectionsStatus.UNKNOWN_ERROR:
                    default: return rej({ result: result, status: status });
                }
            });
        });
    }

    getGeocodeOptions(address: string, bounds?: google.maps.LatLngBounds): google.maps.GeocoderRequest {
        return new google.maps.GeocoderRequest({
            address: address,
            bounds: bounds
        });
    }

    geocode(request: google.maps.GeocoderRequest, bounds?: google.maps.LatLngBounds): Promise<IGeoCodeResult[]> {
        return new Promise<IGeoCodeResult[]>((res, rej) => {
            this.geocoder.geocode(request,
                (results: google.maps.GeocoderResult[], status: google.maps.GeocoderStatus) => {
                    switch (status) {
                        case google.maps.GeocoderStatus.OK: return res(this.convertGeoResults(results));
                        case google.maps.GeocoderStatus.ZERO_RESULTS: return res([]);
                        case google.maps.GeocoderStatus.ERROR: return rej(results);
                        case google.maps.GeocoderStatus.INVALID_REQUEST: return rej(results);
                        case google.maps.GeocoderStatus.OVER_QUERY_LIMIT:
                        case google.maps.GeocoderStatus.UNKNOWN_ERROR:
                        default: return rej(results);
                    }
                });
        });
    }

    // tslint:disable-next-line:max-line-length
    getReverseGeocodeOptions(location: google.maps.LatLng | google.maps.LatLngLiteral, bounds?: google.maps.LatLngBounds): google.maps.GeocoderRequest {
        return new google.maps.GeocoderRequest({
            location: location,
            bounds: bounds
        });
    }

    reverseGeocode(request: google.maps.GeocoderRequest, bounds?: google.maps.LatLngBounds): Promise<IGeoCodeResult[]> {
        return this.geocode(request, bounds);
    }

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
    };

    // Turns an array of direction objects into an array of arrays of latlng points
    // One array for each set of directions
    getDirectionsAsRouteSteps(directions: Array<google.maps.DirectionsResult>): Array<Array<IRouteStep>> {
        if (!directions) {
            return null;
        }
        const dirs = directions.map<Array<IRouteStep>>((direction: google.maps.DirectionsResult) => {
            const routes = direction.routes.map<Array<IRouteStep>>((route: google.maps.DirectionsRoute) => {
                const legs = route.legs.map<Array<IRouteStep>>((leg: google.maps.DirectionsLeg) => {
                    const steps = leg.steps.map<IRouteStep>((step: google.maps.DirectionsStep) => {
                        return <IRouteStep>{ encoded_lat_lngs: step['encoded_lat_lngs'], durationInSeconds: step.distance.value };
                    });
                    return <Array<IRouteStep>>[].concat([], steps);
                });
                return <Array<IRouteStep>>[].concat([], legs);
            });
            return <Array<IRouteStep>>[].concat([], routes);
        });
    };

    shortenDirectionsAsPaths(directions: Array<google.maps.DirectionsResult>, seconds: number): Array<Array<google.maps.LatLngLiteral>> {
        if (!directions) {
            return null;
        }

        // For each direction result, return one array of points per leg
        // tslint:disable-next-line:max-line-length
        return directions.map<Array<google.maps.LatLngLiteral>>((direction: google.maps.DirectionsResult): Array<google.maps.LatLngLiteral> => {
            if (!direction) {
                return null;
            }
            const routepoints: Array<Array<google.maps.LatLngLiteral>> = direction.routes.map<Array<google.maps.LatLngLiteral>>
                ((route: google.maps.DirectionsRoute): Array<google.maps.LatLngLiteral> => this.shortenDirection(route, seconds));

            return <Array<google.maps.LatLngLiteral>>[].concat.apply([], routepoints);
        });
    };

    shortenDirection(route: google.maps.DirectionsRoute, seconds: number): Array<google.maps.LatLngLiteral> {
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
        return results.map<google.maps.LatLngLiteral>((r: google.maps.LatLng) => {
            return <google.maps.LatLngLiteral>{ lat: r.lat(), lng: r.lng() };
        });
    };

    decodePath(encdodedPath: string): Array<google.maps.LatLngLiteral> {
        return google.maps.geometry.encoding.decodePath(encdodedPath);
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
        });
    };
}
