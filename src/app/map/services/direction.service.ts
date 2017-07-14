import gm = google.maps;

import { Injectable } from '@angular/core';

@Injectable()
export class DirectionService {


    constructor(private dirService: gm.DirectionsService) { }

    public getDirections(searchPoints: gm.DirectionsRequest): Promise<gm.DirectionsResult> {

        return new Promise(function (res, rej) {
            this.dirService.route(searchPoints, function (results, status) {
                switch (status) {
                    case gm.DirectionsStatus.OK:
                        return res(results);
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
                return rej(results);

            })
        })
    }
}