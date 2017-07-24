import { IHcoService } from './ihco.service';

import { hcos } from '../../../testdata/hcos';

export class TestHcoService implements IHcoService {

    getCountries(): Promise<object[]> {
        return new Promise<object[]>(function (res, rej) {
            return res([
                { id: 1489, name: 'Czech' },
                { id: 1490, name: 'France' },
                { id: 1491, name: 'Hungary' },
                { id: 1492, name: 'Italy' }
            ]);
        });
    }

    getHospitals(country: string): Promise<object[]> {
        return new Promise<object[]>(function (res, rej) {
            return res(hcos.filter((h) => h.country === country));
        })
    }

    getHospital(id: number): Promise<object> {
        return new Promise<object[]>(function (res, rej) {
            return res(hcos.filter((h): any => h['id'] === id));
        })
    }
}
