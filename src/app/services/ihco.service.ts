export interface IHcoService {
    getCountries(): Promise<Object[]>;
    getHospitals(country_code: number): Promise<Object[]>;
}
