import {
  Component,
  AfterViewInit,
  ViewChildren,
  Inject,
  InjectionToken,
  QueryList,
  ElementRef,
  EventEmitter,
  Output
} from '@angular/core';

import { IMapService } from './abstractions/imap.service';
import { IHcoService } from '../services/ihco.service';
import { IGeoCodeResult } from './abstractions/igeocode.result';
import { IMarkerOptions } from './abstractions/imarker.options';
import { IDirectionsRequest } from './abstractions/idirections.request';
import { IRouteStep } from './abstractions/iroutestep';
import { IHospital } from '../data/ihospital';
import { ICountry } from '../data/icountry';

export const PROVIDERS = new InjectionToken<IMapService>('IMapService');

import * as data from '../../../testdata/firebasestr.json';

const hcos: Array<any> = (<any>data);

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})

export class MapComponent implements AfterViewInit {

  @Output()
  boundsChanged: EventEmitter<any> = new EventEmitter();

  @Output()
  dragEnd: EventEmitter<any> = new EventEmitter();

  @Output()
  currentBounds: any;

  @ViewChildren('map') private mapDivRefs: QueryList<ElementRef>

  private mapService: IMapService;
  private currentProviderIndex = 0;

  private markerShapes: Map<number, any> = new Map<number, any>();

  private countryMap: Map<number, Promise<ICountry>> = new Map<number, Promise<ICountry>>();
  private hospitalMap: Map<number, Promise<IHospital>> = new Map<number, Promise<IHospital>>();

  hospitals: Array<IHospital> = new Array<IHospital>();


  constructor(
    @Inject(PROVIDERS) private readonly providers: Array<IMapService>,
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) { }

  // AfterViewInit implementation
  ngAfterViewInit(): void {
    this.mapDivRefs.forEach((div: ElementRef, index: number) => {
      const provider = this.providers[index];
      provider.initMap(div.nativeElement, {}).then((_map) => {
        provider.setCenter(provider.getLocation(38.468589, 21.143545));
        provider.setZoom(8);

        provider.addListener('dragend', this.mapDragEnd);
        provider.addListener('bounds_changed', this.mapBoundsChanged);


      }).catch((err) => {
        throw err;
      });
    })
  }
  // End OnInit

  private mapBoundsChanged = () => {
    console.log('Bounds');
    const p = this.providers[this.currentProviderIndex];
    this.currentBounds = p.getBounds();

    this.dragEnd.emit(this.currentBounds);
  }

  private mapDragEnd = () => {
    console.log('DragEnd');
    const p = this.providers[this.currentProviderIndex];
    this.currentBounds = p.getBounds();
    this.boundsChanged.emit(this.currentBounds);
  }

  // Data Promises
  private async ensureCountryCenterAndBounds(country: ICountry): Promise<ICountry> {
    if (this.countryMap.has(country.id)) {
      console.log(`found ${country.name} in cache`);
      return await this.countryMap.get(country.id);
    }

    const promise = new Promise<ICountry>((res, rej) => {
      if (country.bounds && country.center) {
        console.log(`${country.name} in database has location data`);
        return res(country);
      }
      return this.providers[this.currentProviderIndex].geocode(country.name)
        .then((results: Array<IGeoCodeResult>) => {
          if (results.length) {
            console.log(`${country.name} geocoding found ${results.length} results. Using the first`);

            // Lets just take the first result here
            country.bounds = results[0].bounds.toJSON();
            country.center = results[0].center.toJSON();
            this.hcoService.saveCountryData(country)
              .then((c: ICountry) => res(c)).catch((ex) => rej(ex));
          } else {
            return rej('Geocode for this address produced no results');
          }
        })
        .catch((err) => rej(err))
    })

    this.countryMap.set(country.id, promise);

    return await promise;
  }



  private async ensureHospitalRoutes(hospital: IHospital): Promise<IHospital> {
    if (this.hospitalMap.has(hospital.id)) {
      return await this.hospitalMap.get(hospital.id)
    };

    const promise = new Promise<IHospital>((res, rej) => {
      if (hospital.radiusDirections) {
        return res(hospital);
      }

      const p = this.providers[this.currentProviderIndex];
      const searchPoints = p.getRadialPoints(p.getLocation(hospital.lat, hospital.lng), 12, 30);

      searchPoints.map((sp) => {
        const directionsReq: IDirectionsRequest = {
          travelMode: 'DRIVING',
          destination: p.getLocation(sp.lat(), sp.lng()),
          origin: p.getLocation(hospital.lat, hospital.lng)
        };

        p.directions(directionsReq).then((routes) => {
          const radiusDirs = p.getDirectionAsRouteSteps(routes);
          this.hcoService.saveHospitalData(hospital)
            .then((hospital) => {
              return hospital;
            });

        }).catch((err) => {
          throw err;
        })
      });
    });

    this.hospitalMap.set(hospital.id, promise);

    return await promise;
  }

  private processArray = (array, fn) => {
    var results = [];
    return array.reduce(function (p, item) {
      return p.then(function () {
        return fn(item).then(function (data) {
          results.push(data);
          return results;
        });
      });
    }, Promise.resolve());
  }

  private ensureLatLng(hospital: IHospital): Promise<IHospital> {
    if (hospital.lat && hospital.lng) {
      return Promise.resolve(hospital);
    }

    const match = hcos.filter((h) => h.title === hospital.name);

    if (match.length && match[0].lat && match[0].lng) {
      hospital.lat = match[0].lat;
      hospital.lng = match[0].lng;
      hospital.city = match[0].city;
      hospital.postcode = match[0].postcode;
      hospital.address = hospital.address || match[0].address;

      return Promise.resolve(hospital);
    }

    const location = hospital.name;
    const p = this.providers[this.currentProviderIndex];

    return this.hcoService.getCountries().then((countries) => {
      const cunts = countries.filter(c => c.id === hospital.country);
      if (!cunts.length) {
        console.log(`Unrecognized country ID: ${hospital.country}`);
        return;
      }

      const cunt = cunts[0];
      const loc = `${hospital.name}, ${cunt.name}`;
      return loc;
    }).then(location => p.geocode(location).then((result: Array<IGeoCodeResult>) => {
      if (!result.length) {
        console.log(`${location} was not found`);
        return null;
      }
      hospital.address = (<any>result[0].center).address;
      hospital.lat = (<any>result[0].center).lat();
      hospital.lng = (<any>result[0].center).lng();
      return hospital;
    }));
  }

  private processHospital = (hospital: IHospital): Promise<IHospital> => {
    const p = this.providers[this.currentProviderIndex];

    if (hospital.radiusDirections) {
      console.log(`hospital: ${hospital.id}, ${hospital.name} skipped`);
      return Promise.resolve(hospital);
    }

    const searchPoints = p.getRadialPoints(p.getLocation(hospital.lat, hospital.lng), 12, 30);

    const directions = searchPoints.map(s => {
      return <IDirectionsRequest>{
        travelMode: 'DRIVING',
        destination: p.getLocation(s.lat(), s.lng()),
        origin: p.getLocation(hospital.lat, hospital.lng)
      };
    });

    const func = p.directions;

    return this.ensureLatLng(hospital)
      .then(h => this.processArray(directions, func.bind(p))
        .then(routes => {
          const radiusDirs = p.getDirectionsAsRouteSteps(routes);
          hospital.radiusDirections = radiusDirs;
          return this.hcoService.saveHospitalData(hospital)
            .then((hospital) => {
              return hospital;
            }).catch((err) => {
              console.log(err);
            });
        })
        .catch((err) => {
          console.log(err);
        }));
  }



  // Event Handlers
  countryChanged = (country: ICountry): void => {
    const p = this.providers[this.currentProviderIndex];
    console.log(`Changing to ${country.name}`)
    this.ensureCountryCenterAndBounds(country).then((c) => {
      p.setCenter(p.getLocation(c.center.lat, c.center.lng));
      p.setBounds(c.bounds);

      this.hcoService.getHospitals(c.id)
        .then(hospitals => {
          this.hospitals = hospitals;
        });
    });
  }

  private showMarkers = (hospitals: Array<any>) => {
    const p = this.providers[this.currentProviderIndex];
    hospitals.forEach((h) => {
      const options: IMarkerOptions = {
        id: h.id,
        label: h.title,
        onClick: (args) => {
          this.mk2(args);
        }
      };
      const marker = p.setMarker(p.getMarker(p.getLocation(h.lat, h.lng), options));
    });
  }


  //   const _me = this;
  //   const promises = this.providers.map((p) => p.geocode(country.name));
  //   this.providers.map((p) => p.removeMarkers());

  //   promises.push(this.hcoService.getHospitals(country.name));

  //   Promise.all(promises).then((results: any[]) => {
  //     const hcos: any[] = results[2];
  //     _me.providers.map((p: IMapService, i: number) => {
  //       p.setCenter(results[i][0].center);
  //       p.setBounds(results[i][0].view);
  //     })

  //     hcos.forEach((h, i) => {
  //       _me.providers.map((p) => {
  //         const options: IMarkerOptions = {
  //           id: h.id,
  //           label: h.title,
  //           onClick: (args) => {
  //             _me.mk2(args);
  //           }
  //         };
  //         const marker = p.setMarker(p.getMarker(p.getLocation(h.lat, h.lng), options));
  //       })
  //     })
  //   }).catch((err) => {
  //     throw err;
  //   });
  // }

  providerChanged(index: number): void {
    this.currentProviderIndex = index;
  }

  clearMap(event: MouseEvent): void {
    this.providers.forEach((p) => {

    })
  }

  private markerClickHandler = (args) => {

    this.drawDrivingTimeFromMarkerInMinutes(args['marker'], 30);
  };


  private mk2(args): void {
    this.drawDrivingTimeFromMarkerInMinutes(args['marker'], 30);

  }

  private getMarkerShapes(marker: any): void {
    // this.hcoService.getHospital(())
  }

  private showMarkerRoutes(marker: any): void {

  }

  private hideMarkerRoutes(marker: any): void {

  }

  // getMarkerRadialDirections(marker: any): Array<IRouteStep> {
  //   const id = marker.id;
  //   this.hcoService.getHospital(id).then((h) => {
  //     if (!h.radialRoutes) {
  //       const p = this.providers[this.currentProviderIndex];
  //       const center = marker.position;
  //       const searchPoints = p.getRadialPoints(marker, 12, 30);

  //       return searchPoints.map((s, i) => {
  //         const req = p.getDirectionsRequest(<IDirectionsRequest>{
  //           travelMode: 'DRIVING',
  //           origin: center,
  //           destination: s
  //         });

  //         return p.directions(req).then((directions) => {
  //           return (h.radialRoutes = p.getDirectionAsRouteSteps(directions));
  //         });
  //       })
  //     } else {
  //       return [
  //         Promise.resolve(<Array<IRouteStep>>h.radialRoutes)
  //       ]
  //     }
  //   })
  // }

  drawDrivingTimeFromMarkerInMinutes(marker: any, minutes: number): void {
    const p = this.providers[this.currentProviderIndex];
    const center = marker.position;
    const searchPoints = p.getRadialPoints(marker, 12, 30);
    const promises = searchPoints.map((s, i) => {
      const req: google.maps.DirectionsRequest = {
        travelMode: google.maps.TravelMode.DRIVING,
        origin: center,
        destination: s
      };

      return p.directions(req);
    })

    Promise.all(promises)
      .then((results) => {
        const routes = p.getDirectionsAsRouteSteps(results);
        const shortenedRoutes = routes.map((r) => p.shortenRouteStepsByDuration(r, (minutes * 60)));
        let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
        shapepoints = p.getConvexHull(shapepoints)

        const shapeoptions = p.getShapeOptions({});
        const shape = p.getShape(shapepoints, shapeoptions);
        p.drawShape(shape);

        shortenedRoutes.forEach((r, i2) => {
          const lineoptions = p.getLineOptions({});
          const linepoints = [].concat.apply([], r);
          p.drawLine(p.getLine(linepoints, lineoptions));
        })
      });
  }

  drawDrivingDistanceFromMarkerInMeters(marker: any, meters: number): void {

  }
}
