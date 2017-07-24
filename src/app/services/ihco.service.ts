export interface IHcoService {
    getCountries(): Promise<any[]>;
    getHospitals(country: string): Promise<any[]>;
    getHospital(hco_id: number): Promise<any>;
    // getHospitalRouteData(hco_code: number): Promise<any[]>;
}
