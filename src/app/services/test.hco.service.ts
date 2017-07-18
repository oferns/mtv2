import { IHcoService } from './ihco.service';

export class TestHcoService implements IHcoService {

    getCountries(): Promise<Object[]> {
        return new Promise<Object[]>(function (res, rej) {
            return res([
                { id: 1489, name: 'Czech' },
                { id: 1490, name: 'France' },
                { id: 1491, name: 'Hungary' },
                { id: 1492, name: 'Italy' }
            ]);
        });
    }

    getHospitals(country_code: number): Promise<Object[]> {
        return new Promise<Object[]>(function (res, rej) {
            const hcos = [];
            switch (country_code) {
                case 1489:
                    hcos.push([
                        {
                            'title': 'Záchranná služba',
                            'address': 'Jeníkovská 348',
                            'city': 'Čáslav',
                            'postcode': '28601',
                            'country': 'Czech',
                            'lat': '50.075307',
                            'lng': '14.455095',
                            'location': {
                                'lat': '50.075307',
                                'lng': '14.455095'
                            }
                        },
                        {
                            'title': 'Nemocnice s poliklinikou',
                            'address': 'Purkyňova 1849',
                            'city': 'Česká Lípa',
                            'postcode': '47077',
                            'country': 'Czech',
                            'lat': '49.225711',
                            'lng': '16.582038',
                            'location': {
                                'lat': '49.225711',
                                'lng': '16.582038'
                            }
                        },
                        {
                            'title': 'Nemocnice České Budějovice',
                            'address': 'B. Němcové 585/54',
                            'city': 'České Budějovice',
                            'postcode': '37087',
                            'country': 'Czech',
                            'lat': '48.961136',
                            'lng': '14.467507',
                            'location': {
                                'lat': '48.961136',
                                'lng': '14.467507'
                            }
                        },
                        {
                            'title': 'Masarykova nemocnice',
                            'address': 'Sociální péče 3316/12A',
                            'city': 'Ústí nad Labem',
                            'postcode': '40011',
                            'country': 'Czech',
                            'lat': '50.681173',
                            'lng': '14.022266',
                            'location': {
                                'lat': '50.681173',
                                'lng': '14.022266'
                            }
                        },
                    ]);
                    break;
                case 1490:
                    hcos.push([
                        {
                            'title': 'CH D ABBEVILLE',
                            'address': '43 RUE DE L ISLE',
                            'city': 'ABBEVILLE CEDEX',
                            'postcode': '80142',
                            'country': 'France',
                            'lat': '48.478852',
                            'lng': '4.767534',
                            'location': {
                                'lat': '48.478852',
                                'lng': '4.767534'
                            }
                        },
                        {
                            'title': 'CENTRE DE SOINS POLYVALENT',
                            'address': 'BOULEVARD DES HELLENES',
                            'city': 'AGDE CEDEX',
                            'postcode': '34304',
                            'country': 'France',
                            'lat': '43.299603',
                            'lng': '3.482630',
                            'location': {
                                'lat': '43.299603',
                                'lng': '3.482630'
                            }
                        },
                        {
                            'title': 'CLINIQUE ESQUIROL SAINT HILAIRE',
                            'address': '1 RUE DOCTEUR ET MADAME DELMAS',
                            'city': 'AGEN CEDEX',
                            'postcode': '47002',
                            'country': 'France',
                            'lat': '44.185254',
                            'lng': '0.631972',
                            'location': {
                                'lat': '44.185254',
                                'lng': '0.631972'
                            }
                        },
                        {
                            'title': 'CH D AGEN',
                            'address': 'ROUTE  DE VILLENEUVE',
                            'city': 'AGEN CEDEX 9',
                            'postcode': '47923',
                            'country': 'France',
                            'lat': '44.399518',
                            'lng': '0.605689',
                            'location': {
                                'lat': '44.399518',
                                'lng': '0.605689'
                            }
                        },
                        {
                            'title': 'CHI DU VEXIN SITE D AINCOURT',
                            'address': 'PARC DE LA BUCAILLE',
                            'city': 'AINCOURT',
                            'postcode': '95510',
                            'country': 'France',
                            'lat': '49.080765',
                            'lng': '1.762092',
                            'location': {
                                'lat': '49.080765',
                                'lng': '1.762092'
                            }
                        },
                        {
                            'title': 'CHPA',
                            'address': 'AVENUE DES TAMARIS',
                            'city': 'AIX EN PROVENCE CEDEX 1',
                            'postcode': '13616',
                            'country': 'France',
                            'lat': '43.535229',
                            'lng': '5.441560',
                            'location': {
                                'lat': '43.535229',
                                'lng': '5.441560'
                            }
                        }
                    ]);
                    break;
                case 1491:
                    hcos.push([
                        {
                            'title': 'Josa Andras Hospital',
                            'address': 'Szent I. 68',
                            'city': 'Nyiregyhaza',
                            'postcode': '4400',
                            'country': 'Hungary',
                            'lat': '46.310260',
                            'lng': '17.349022',
                            'location': {
                                'lat': '46.310260',
                                'lng': '17.349022'
                            }
                        },
                        {
                            'title': 'Komlói Egészségcentrum',
                            'address': 'Majális tér 1.',
                            'city': 'Komló',
                            'postcode': '7300',
                            'country': 'Hungary',
                            'lat': '46.188709',
                            'lng': '18.272125',
                            'location': {
                                'lat': '46.188709',
                                'lng': '18.272125'
                            }
                        },
                        {
                            'title': 'Markhot Ferenc Kórház-Rendelőint',
                            'address': 'Széchenyi I. u. 27-29.',
                            'city': 'Eger',
                            'postcode': '3300',
                            'country': 'Hungary',
                            'lat': '47.203454',
                            'lng': '16.822147',
                            'location': {
                                'lat': '47.203454',
                                'lng': '16.822147'
                            }
                        },
                        {
                            'title': 'Városi Rehab. Szakkórház-Rendelő',
                            'address': 'Fáskert u. 1.',
                            'city': 'Nagykőrös',
                            'postcode': '2750',
                            'country': 'Hungary',
                            'lat': '47.101770',
                            'lng': '17.904406',
                            'location': {
                                'lat': '47.101770',
                                'lng': '17.904406'
                            }
                        },
                        {
                            'title': 'Árpád-házi Szt. Erzsébet Szakkór',
                            'address': 'Hősök tere 7.',
                            'city': 'Tata',
                            'postcode': '2890',
                            'country': 'Hungary',
                            'lat': '47.399349',
                            'lng': '19.114126',
                            'location': {
                                'lat': '47.399349',
                                'lng': '19.114126'
                            }
                        }
                    ]);
                    break;
                case 1492:
                    hcos.push([
                        {
                            'title': 'CASA DI CURA DI ABANO A TERME',
                            'address': 'PIAZZA CRISTOFORO COLOMBO 1',
                            'city': 'ABANO TERME',
                            'postcode': '35031',
                            'country': 'Italy',
                            'lat': '43.818612',
                            'lng': '7.777903',
                            'location': {
                                'lat': '43.818612',
                                'lng': '7.777903'
                            }
                        },
                        {
                            'title': 'OSPEDALE NOTTOLA',
                            'address': 'VIA PROVINCIALE MONTEPULCIANO 5',
                            'city': 'ABBADIA',
                            'postcode': '53045',
                            'country': 'Italy',
                            'lat': '43.111774',
                            'lng': '11.792233',
                            'location': {
                                'lat': '43.111774',
                                'lng': '11.792233'
                            }
                        },
                        {
                            'title': 'CASA DI CURA VILLA DEI FIORI',
                            'address': 'CORSO ITALIA 157',
                            'city': 'ACERRA',
                            'postcode': '80011',
                            'country': 'Italy',
                            'lat': '40.631991',
                            'lng': '14.410501',
                            'location': {
                                'lat': '40.631991',
                                'lng': '14.410501'
                            }
                        },
                        {
                            'title': 'OSPEDALE CIVILE',
                            'address': 'VIA CESARE BATTISTI 68',
                            'city': 'ACQUAPENDENTE',
                            'postcode': '1021',
                            'country': 'Italy',
                            'lat': '40.466466',
                            'lng': '17.255734',
                            'location': {
                                'lat': '40.466466',
                                'lng': '17.255734'
                            }
                        },
                        {
                            'title': 'ENTE ECCLES OSP GENERALE MIULLI',
                            'address': 'SP127 ACQUAVIVA-SANTERAMO KM 41',
                            'city': 'ACQUAVIVA DELLE FONTI',
                            'postcode': '70021',
                            'country': 'Italy',
                            'lat': '40.466466',
                            'lng': '17.255734',
                            'location': {
                                'lat': '40.466466',
                                'lng': '17.255734'
                            }
                        },
                        {
                            'title': 'OSPEDALE CIVILE',
                            'address': 'VIA FATEBENEFRATELLI 1',
                            'city': 'ACQUI TERME',
                            'postcode': '15011',
                            'country': 'Italy',
                            'lat': '45.473148',
                            'lng': '9.189564',
                            'location': {
                                'lat': '45.473148',
                                'lng': '9.189564'
                            }
                        }
                    ]);
                    break;
            }
            return res(hcos);
        })
    }
}
