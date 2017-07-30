import { IHcoService } from './ihco.service';

import { IRouteStep } from '../map/abstractions/iroutestep';


import { hcos } from '../../../testdata/hcos';

import { IHospital } from '../data/ihospital';
import { ICountry } from '../data/icountry';

export class TestHcoService implements IHcoService {

    private _countries: Promise<Array<ICountry>>;
    private _hospitals: Map<number, Promise<Array<IHospital>>> = new Map<number, Promise<Array<IHospital>>>();
    private _hospital: Map<number, Promise<IHospital>> = new Map<number, Promise<IHospital>>();

    async getCountries(): Promise<Array<ICountry>> {
        return await this._countries || (this._countries = new Promise<Array<ICountry>>(function (res, rej) {
            return res([
                { id: 1489, name: 'Czech' },
                { id: 1490, name: 'France' },
                { id: 1491, name: 'Hungary' },
                { id: 1492, name: 'Italy' }
            ]);
        }));
    }


    async getHospitals(country_id: number): Promise<Array<IHospital>> {

        if (this._hospitals.has(country_id)) {
            return this._hospitals.get(country_id);
        }

        const promise = new Promise<Array<IHospital>>(function (res, rej) {
            return res(hcos.filter((h) => h.country === country_id));
        });

        this._hospitals.set(country_id, promise)
        return promise;
    }

    getHospital(id: number): Promise<IHospital> {
        if (this._hospital.has(id)) {
            return this._hospital.get(id)
        }

        const promise = new Promise<IHospital>(function (res, rej) {
            const hospital = hcos.filter((h: IHospital) => h.id === id);
            return res(hospital.length ? hospital[0] : null);
        })

        this._hospital.set(id, promise);
        return promise;
    }

    saveHospitalRoutes(hco_id: number, routeSteps: Array<Array<IRouteStep>>): Promise<Array<Array<IRouteStep>>> {
        return this._hospital.get(hco_id)
            .then((h: IHospital) => {
                const promise = new Promise<IHospital>((res, rej) => {
                    h.radiusDirections = routeSteps;
                    return res(h);
                })

                this._hospital.set(h.id, promise)
                return h.radiusDirections;
            });
    }

}
