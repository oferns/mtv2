export interface IHcoService {
    getCountries(): Promise<any[]>;
    getHospitals(country_code: number): Promise<Object[]>;
}
