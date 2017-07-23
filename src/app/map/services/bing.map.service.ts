import { Injectable } from '@angular/core';

import { } from '@types/bingmaps';

import { IMapService } from '../abstractions/imap.service';
import { IMapOptions } from '../abstractions/imap.options';
import { IGeoCodeResult } from '../abstractions/igeocode.result';

import { env } from '../../../env/env';

declare var Microsoft: any;

@Injectable()
export class BingMapService implements IMapService {

    private map: Microsoft.Maps.Map;
    private searchManager: any;
    private scriptLoadingPromise: Promise<void>;

    provider = 'Bing';

    constructor() {
        const script: HTMLScriptElement = window.document.createElement('script');

        script.type = 'text/javascript';
        script.async = script.defer = true;
        script.src = `//www.bing.com/api/maps/mapcontrol?callback=${this.provider}`;

        this.scriptLoadingPromise = new Promise<void>((resolve: Function, reject: Function) => {
            (<any>window)[this.provider] = () => {
                resolve();
            };

            script.onerror = (error: Event) => {
                reject(error);
            };
        });

        window.document.body.appendChild(script);

        this.onReady().then(() => {
            Microsoft.Maps.loadModule('Microsoft.Maps.Search', () => {
                this.searchManager = new Microsoft.Maps.Search.SearchManager(this.map);
            })
        }).catch(err => {
            throw err;
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

    getOptions(options: IMapOptions): any {
        return {};
    }

    directions(searchPoints: any): Promise<object[]> {
        return new Promise(function (res, rj) {
            return res();
        });
    }

    getLocation(lat: number, lng: number): Microsoft.Maps.Location {
        return new Microsoft.Maps.Location(lat, lng);
    }

    setCenter(location: Microsoft.Maps.Location): Microsoft.Maps.Location {
        this.map.setView({
            center: location
        });
        return location;
    }

    getCenter(): Microsoft.Maps.Location {
        return this.map.getCenter();
    }

    setZoom(zoom: number): void {
        this.map.setView({
            zoom: zoom
        });
    }

    setBounds(bounds: Microsoft.Maps.LocationRect): void {
        this.map.setView({
            bounds: bounds
        });
    }

    getBounds(): Microsoft.Maps.LocationRect {
        return this.map.getBounds();
    }

    getBoundsObj(nw: Microsoft.Maps.Location, se: Microsoft.Maps.Location): Microsoft.Maps.LocationRect {
        return Microsoft.Maps.LocationRect.fromCorners(nw, se);
    }

    addListener(event: string, handler: (...args: any[]) => void): void {
        Microsoft.Maps.Events.addHandler(this.map, event, handler)
    }

    private convertGeoResults(results: any): IGeoCodeResult[] {
        return results.map(function (r) {
            return {
                address: r.address,
                bounds: r.bestView,
                view: r.bestView,
                center: r.location,
                name: r.name
            };
        });
    }

    geocode(location: string | Microsoft.Maps.LocationRect): Promise<any[]> {
        const _me = this;
        return this.onReady().then(() => {
            return new Promise<any[]>((res, rej) => {

                const options = {
                    callback: (result: any, data: any): void => {
                        return res(_me.convertGeoResults(result.results));
                    },
                    error: (result: any, data: any): void => {
                        return rej(result.results);
                    }
                };

                if (typeof location === 'string') {
                    options['where'] = location;
                } else if (location instanceof Microsoft.Maps.LocationRect) {
                    options['bounds'] = <Microsoft.Maps.LocationRect>location;
                }

                _me.searchManager.geocode(options);
            });
        });
    }

    setMarker(marker: Microsoft.Maps.Pushpin): Microsoft.Maps.Pushpin {
        this.map.entities.push(marker);
        return marker;
    };

    getMarker(lat: number, lng: number, options: any): Microsoft.Maps.Pushpin {
        return new Microsoft.Maps.Pushpin(this.getLocation(lat, lng), options);
    };

    removeMarker(marker: Microsoft.Maps.Pushpin): Microsoft.Maps.Pushpin {
        this.map.entities.remove(marker);
        return marker;
    };
}
