import {
  Component,
  AfterViewInit,
  ViewChild,
  ViewChildren,
  Inject,
  InjectionToken,
  QueryList,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  trigger,
  state,
  animate,
  transition,
  style
} from '@angular/animations';

import { Logger } from 'angular2-logger/core';
import { IMapService } from './abstractions/imap.service';
import { IHcoService } from '../services/ihco.service';
import { IGeoCodeResult } from './abstractions/igeocode.result';
import { IMarkerOptions } from './abstractions/imarker.options';
import { IDirectionsRequest } from './abstractions/idirections.request';
import { IRouteStep } from './abstractions/iroutestep';
import { IHospital } from '../data/ihospital';
import { ICountry } from '../data/icountry';
import { PROVIDERS } from './toolbar/module';
import { HospitalListComponent } from './hospitallist/component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('false', style({ opacity: 1, transform: 'scale(1.0)' })),
      state('true', style({ opacity: 0, transform: 'scale(0.0)' })),
      transition('1 => 0', animate('300ms')),
      transition('0 => 1', animate('900ms'))
    ])
  ]
})

export class MapComponent implements AfterViewInit {

  @Input()
  isLoading = true;

  @Output()
  loadStarted: EventEmitter<void> = new EventEmitter();

  @Output()
  loadFinished: EventEmitter<void> = new EventEmitter();

  @Output()
  boundsChanged: EventEmitter<any> = new EventEmitter();

  @Output()
  dragEnd: EventEmitter<any> = new EventEmitter();

  @Output()
  currentBounds: any;

  @ViewChildren('map') private mapDivRefs: QueryList<ElementRef>

  @ViewChild(HospitalListComponent) private hospitalList: HospitalListComponent;

  private mapService: IMapService;
  private currentProviderIndex = 0;

  @Input()
  currentProvider: IMapService;

  @Input()
  currentCountry: ICountry;

  private markerShapes: Map<number, any> = new Map<number, any>();

  private countryMap: Map<number, Promise<ICountry>> = new Map<number, Promise<ICountry>>();
  private hospitalMap: Map<number, Promise<IHospital>> = new Map<number, Promise<IHospital>>();

  hospitals: Array<IHospital> = new Array<IHospital>();
  countries: Array<ICountry> = new Array<ICountry>();

  private hospitalMarkers: Map<IHospital, any> = new Map<IHospital, any>();

  private timeout;

  constructor(
    private readonly log: Logger,
    @Inject(PROVIDERS) private readonly providers: Array<IMapService>,
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) {
    this.log.info('MapComponent constructor called');
    this.currentProvider = providers[0];
  }

  ngAfterViewInit(): void {
    this.log.info('MapComponent ngAfterViewInit called');

    this.mapDivRefs.map((div: ElementRef, index: number) => {
      const provider = this.providers[index];
      return provider.initMap(div.nativeElement, {}).then((_map) => {
        provider.setCenter(provider.getLocation(38.468589, 21.143545));
        provider.setZoom(8);
        provider.addListener('dragend', this.mapDragEnd);
        provider.addListener('bounds_changed', this.mapBoundsChanged.bind(this));
      }).catch((err) => {
        this.log.error(`MapComponent: Error initializing map provider ${err}`);
        throw err;
      });
    })
  }

  private hospitalLoading(hospital: IHospital): void {
    this.log.info(`MapComponent hospitalLoading ${hospital.id}`);
    const p = this.currentProvider;

    if (this.hospitalMarkers.has(hospital)) {
      return p.setMarker(this.hospitalMarkers.get(hospital));
    }

    const options = <IMarkerOptions>{
      title: hospital.name,
      icon: this.pinSymbol(hospital.strokeCenter ? 'red' : 'white', hospital.representative ? 1.2 : 1.1)
    };

    const marker = p.getMarker(p.getLocation(hospital.lat, hospital.lng), options);

    this.hospitalMarkers.set(hospital, marker)
    p.setMarker(marker);
  }

  private pinSymbol(color: string, scale: number): any {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 1,
      scale: scale,
      labelOrigin: this.currentProvider.getPoint(0, -29)
    };
  }

  private hospitalLoaded(hospital: IHospital) {
    const d = 1;
  }

  private mapBoundsChanged = (): void => {

    window.clearTimeout(this.timeout);

    this.timeout = window.setTimeout(() => {
      this.log.info('MapComponent mapBoundsChanged called');
      this.currentBounds = this.currentProvider.getBounds();
      this.boundsChanged.emit(this.currentBounds);
    }, 500);
  }

  private mapDragEnd = (): void => {
    this.log.info('MapComponent mapDragEnd called');
    const p = this.providers[this.currentProviderIndex];
    this.currentBounds = p.getBounds();
    this.dragEnd.emit(this.currentBounds);
  }

  // Data Promises
  private ensureCountryCenterAndBounds = async (country: ICountry): Promise<ICountry> => {
    this.log.info(`MapComponent ensureCountryCenterAndBounds called for ${country.name} (${country.id})`);

    if (this.countryMap.has(country.id)) {
      this.log.info(`MapComponent ensureCountryCenterAndBounds found ${country.name} (${country.id}) in cache. Returning`);
      return await this.countryMap.get(country.id);
    }

    this.log.info(`MapComponent ensureCountryCenterAndBounds did not find ${country.name} (${country.id}) in cache.`);

    const promise = new Promise<ICountry>((res, rej) => {
      if (country.bounds && country.center) {
        this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name} has location data in database. Returning.`);
        return res(country);
      }

      this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name}
      DOES NOT HAVE location data in the database. Geocoding using current provider`);
      return this.providers[this.currentProviderIndex].geocode(country.name)
        .then((results: Array<IGeoCodeResult>) => {
          if (results.length) {
            this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name}
            geocoding found ${results.length} results. Using the first result to get bounds and centre`);
            // Lets just take the first result here
            country.bounds = results[0].bounds.toJSON();
            country.center = results[0].center.toJSON();

            this.log.info(`MapComponent ensureCountryCenterAndBounds saving geo info for ${country.name} (${country.id})`);
            this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id})
            centre: Lat ${country.bounds.lat} Lng ${country.bounds.lat}`);

            this.hcoService.saveCountryData(country)
              .then((country: ICountry) => {
                this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id}) geo info saved`);
                return res(country);
              })
              .catch((err) => {
                this.log.error(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id}) ERROR saving geo info`);
                this.log.error(err);
                return rej(err);
              });
          } else {
            this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id}) geocode produced no information.`);
            return rej('Geocode for this address produced no results');
          }
        })
        .catch((err) => {
          this.log.error(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id}) ERROR getting geo info`);
          this.log.error(err);
          return rej(err);
        });
    })

    this.log.info(`MapComponent ensureCountryCenterAndBounds ${country.name} (${country.id}) setting Promise in map`);
    this.countryMap.set(country.id, promise);

    return await promise;
  }

  private ensureHospitalRoutes = async (hospital: IHospital): Promise<IHospital> => {
    this.log.info(`MapComponent ensureHospitalRoutes called for ${hospital.name} (${hospital.id})`);

    if (this.hospitalMap.has(hospital.id)) {
      this.log.info(`MapComponent ensureHospitalRoutes found ${hospital.name} (${hospital.id}) in cache. Returning`);
      return await this.hospitalMap.get(hospital.id)
    };

    if (hospital.radiusDirections) {
      this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) has location data in database. Returning.`);
      this.hospitalMap.set(hospital.id, Promise.resolve(hospital));
      return await this.hospitalMap.get(hospital.id);
    }

    // if (hospital.lat === 0 && hospital.lng === 0) {
    //   hospital.radiusDirections = new Array<Array<IRouteStep>>();
    //   this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) saving UNKNOWN hospital data`);
    //   return await this.hcoService.saveHospitalData(hospital)
    //     .subscribe((h) => {
    //       this.log.info(`MapComponent ensureHospitalRoutes ${h.name} (${h.id}) hospital data SAVED`);
    //       this.hospitalMap.set(h.id, Promise.resolve(h));
    //       return h;
    //     }).catch((err) => {
    //       this.log.error(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) ERROR getting directions from provider`);
    //       this.log.error(err);
    //       return hospital;
    //     })
    // }

    // this.log.info(`MapComponent ensureHospitalRoutes did not find ${hospital.name} (${hospital.id}) in cache.`);

    // const promise = new Promise<IHospital>(async (res, rej) => {
    //   const p = this.providers[this.currentProviderIndex];
    //   this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) Getting search points`);
    //   const searchPoints = p.getRadialPoints(p.getLocation(hospital.lat, hospital.lng), 12, 30);
    //   const dirReqs = searchPoints.map<IDirectionsRequest>((sp) => {
    //     return <IDirectionsRequest>{
    //       travelMode: 'DRIVING',
    //       destination: p.getLocation(sp.lat(), sp.lng()),
    //       origin: p.getLocation(hospital.lat, hospital.lng)
    //     };
    //   });

    //   return await Promise.all(dirReqs.map<Promise<any>>(async (r: IDirectionsRequest) => {
    //     return await p.directions(r)
    //       .then((d: Array<IRouteStep>) => {
    //         this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id})
    //                     Directions request for Lat ${r.destination.lat()} Lng ${r.destination.lng()}`);
    //         return <Array<IRouteStep>>p.getDirectionAsRouteSteps(d);
    //       })
    //       .catch((err) => {
    //         return [];
    //       })
    //   })).then((routes: Array<Array<IRouteStep>>) => {
    //     this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) setting radiusDirections. ${routes.length}`);
    //     hospital.radiusDirections = routes;
    //     return hospital;
    //   }).then((hospital: IHospital) => {
    //     this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) saving hospital data`);
    //     return this.hcoService.saveHospitalData(hospital)
    //       .then((hospital) => {
    //         this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) hospital data SAVED`);
    //         return res(hospital);
    //       }).catch((err) => {
    //         this.log.error(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) ERROR getting directions from provider`);
    //         this.log.error(err);
    //         return res(hospital);
    //       })
    //   })
    //     .catch((err) => {
    //       hospital.radiusDirections = new Array<Array<any>>();
    //       return res(hospital);
    //     })
    // });

    // this.log.info(`MapComponent ensureHospitalRoutes ${hospital.name} (${hospital.id}) setting Promise in map`);

    // this.hospitalMap.set(hospital.id, promise);

    // return await promise;
  }

  private ensureHospitalLocation = async (hospital: IHospital): Promise<IHospital> => {
    this.log.info(`MapComponent ensureHospitalLocation called for ${hospital.name} (${hospital.id})`);

    if (hospital.lat != null && hospital.lng != null) {
      this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id}) has location data. Returning`);
      return await Promise.resolve(hospital);
    }

    const location = hospital.name;
    const p = this.providers[this.currentProviderIndex];

    this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id}) has no location data.`);

    this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id}) finding country.`);
    return await Promise.resolve(hospital);
    // return await this.hcoService.getCountries().then(async countries => {
    //   const cunts = countries.filter(c => c.id === hospital.country);
    //   if (!cunts.length) {
    //     this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id})
    //     cound not find country id ${hospital.country}. Setting lat&lng to 0`);
    //     hospital.lat = 0;
    //     hospital.lng = 0;
    //     return hospital;
    //   }

    //   const cunt = cunts[0];
    //   const loc = `${hospital.name}, ${cunt.name}`;
    //   this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id}) geocoding using ${loc}`);

    //   return await p.geocode(loc).then((result: Array<IGeoCodeResult>) => {
    //     if (!result || !result.length) {
    //       this.log.info(`MapComponent ensureHospitalLocation ${hospital.name} (${hospital.id}) geocoding using ${loc} found NO results`);
    //       hospital.address = 'UNKNOWN';
    //       hospital.lat = 0;
    //       hospital.lng = 0;
    //     } else {
    //       this.log.info(`MapComponent ensureHospitalLocation ${hospital.name}
    //       (${hospital.id}) geocoding using ${loc} found ${result.length} results. Using first`);
    //       hospital.address = (<any>result[0].center).address;
    //       hospital.lat = (<any>result[0].center).lat();
    //       hospital.lng = (<any>result[0].center).lng();
    //     }
    //     return hospital;
    //   });
    // });
  }
  // Event Handlers
  private countryChanged = (country: ICountry): void => {
    this.log.info(`MapComponent countryChanged to  ${country.name} (${country.id})`);
    this.currentCountry = country;
    this.currentProvider.setCenter(this.currentProvider.getLocation(country.center.lat, country.center.lng))
    this.currentProvider.setBounds(country.bounds);
  }

  private hospitalsLoading = (value: boolean): void => {
    this.isLoading = value;
  }

  providerChanged = (provider: IMapService): void => {
    this.currentProvider = provider;
  }

  clearMap = (): void => {
    const p = this.providers[this.currentProviderIndex];
    p.removeShapes();
    p.removeLines();
  }

  drawRoutes = (): void => {
    this.clearMap();
    const p = this.providers[this.currentProviderIndex];

    let index = 0;
    const hc = this.hospitals.filter(h => h.visible).sort((a: any, b: any) => a.lat === b.lat ? (a.lng - b.lng) : a.lat - b.lat);

    const func = () => setTimeout(() => {
      if (index < hc.length) {
        ++index;
        this.drawDrivingTime(hc[index], 30);
        func.apply(this);
      } else {
        alert('finished');
      }
    }, 100)

    func.apply(this);
  }

  private markerClickHandler = (args: any) => {
    if (!this.hospitalMap.has(args.id)) {
      throw new Error('Hospital not found');
    }
    this.hospitalMap.get(args.id)
      .then(h => this.ensureHospitalRoutes(h)
        .then(h => this.drawDrivingTime(h, 30)).catch(err => { throw err; })
      ).catch(err => { throw err; });
  };

  private drawDrivingTime = (hospital: IHospital, minutes: number) => {
    const p = this.providers[this.currentProviderIndex];
    const shortenedRoutes = hospital.radiusDirections.map((r) => p.shortenRouteStepsByDuration(r, (minutes * 60)));
    let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
    shapepoints = p.getConvexHull(shapepoints)

    const shapeoptions = p.getShapeOptions({});
    const shape = p.getShape(shapepoints, shapeoptions);
    p.drawShape(shape);

    shortenedRoutes.forEach((r) => {
      const lineoptions = p.getLineOptions({});
      const linepoints = [].concat.apply([], r);
      p.drawLine(p.getLine(lineoptions, linepoints));
    });
  }
}