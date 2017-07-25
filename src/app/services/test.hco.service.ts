import { IHcoService } from './ihco.service';

import { hcos } from '../../../testdata/hcos';

export class TestHcoService implements IHcoService {

    private _countries: Promise<object[]>;
    private _hospitals: Map<string, Promise<object[]>> = new Map<string, Promise<object[]>>();

    async getCountries(): Promise<object[]> {
        return await this._countries || (this._countries = new Promise<object[]>(function (res, rej) {
            return res([
                { id: 1489, name: 'Czech' },
                { id: 1490, name: 'France' },
                { id: 1491, name: 'Hungary' },
                { id: 1492, name: 'Italy' }
            ]);
        }));
    }


    async getHospitals(country: string): Promise<object[]> {

        if (this._hospitals.has(country)) {
            return this._hospitals.get(country);
        }

        const promise = new Promise<object[]>(function (res, rej) {
            return res(hcos.filter((h) => h.country === country));
        });

        this._hospitals.set(country, promise)
        return promise;
    }

    getHospital(id: number): Promise<object> {
        return new Promise<object[]>(function (res, rej) {
            return res(hcos.filter((h): any => h['id'] === id));
        })
    }
}
