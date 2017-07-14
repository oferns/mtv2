import gm = google.maps;

import { Injectable } from '@angular/core';

@Injectable()
export class DirectionService {

    private dirService: gm.DirectionsService;
    constructor() { this.dirService = new gm.DirectionsService(); }

    public getDirections(searchPoints: gm.DirectionsRequest): Promise<Object[]> {

        return new Promise(function (res, rj) {
            this.dirService.route(searchPoints, function (result, status) {
                switch (status) {
                    case gm.DirectionsStatus.OK:
                        return res(result);
                    case gm.DirectionsStatus.NOT_FOUND:
                        break;
                    case gm.DirectionsStatus.ZERO_RESULTS:
                        break;
                    case gm.DirectionsStatus.OVER_QUERY_LIMIT:
                    case gm.DirectionsStatus.REQUEST_DENIED:
                        break;
                    case gm.DirectionsStatus.UNKNOWN_ERROR:
                        // We should retry.. Retry service impl todo
                        break;

                    default:
                        break;
                }

            })
        })
    }
}