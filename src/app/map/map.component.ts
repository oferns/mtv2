import {
  Component,
  AfterViewInit,
  ViewChildren,
  Inject,
  InjectionToken,
  QueryList,
  ElementRef
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

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})

export class MapComponent implements AfterViewInit {

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
      }).catch((err) => {
        throw err;
      });
    })
  }
  // End OnInit

  // Data Promises
  private async ensureCountryCenterAndBounds(country: ICountry): Promise<ICountry> {
    if (this.countryMap.has(country.id)) {
      return await this.countryMap.get(country.id);
    }

    const promise = new Promise<ICountry>((res, rej) => {
      if (country.bounds && country.center) {
        return res(country);
      }
      return this.providers[this.currentProviderIndex].geocode(country.name)
        .then((results: Array<IGeoCodeResult>) => {
          if (results.length) {
            // Lets just take the first result here
            country.bounds = results[0].bounds;
            country.center = results[0].center;
            return res(country);
          } else {
            return rej('Geocode for this address produced no results');
          }
        }).catch((err) => { throw err; })
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
          this.hcoService.saveHospitalRoutes(hospital.id, radiusDirs)
            .then((steps) => {
              return this.hcoService.getHospital(hospital.id);
            });

        }).catch((err) => {
          throw err;
        })
      });
    });

    this.hospitalMap.set(hospital.id, promise);

    return await promise;
  }

  // Event Handlers
  countryChanged(country: any): void {
    const p = this.providers[this.currentProviderIndex];
    this.ensureCountryCenterAndBounds(country).then((c) => {
      p.setCenter(c.center);
      p.setBounds(c.bounds);
      this.hcoService.getHospitals(c.id)
        .then((hospitals) => {
          this.hospitals = hospitals;
          hospitals.map((h) => {
            this.hcoService.getHospital(h.id).then((h) => {
              this.ensureHospitalRoutes(h)
                .then((hospital) => {
                  hospital.radiusDirections.map((step) => {
                    return <Array<IRouteStep>>p.shortenRouteStepsByDuration(step, 1800);
                  }).map((shortRoutes: Array<IRouteStep>) => {
                    const lineOptions = p.getLineOptions({});
                    return p.drawLine(p.getLine(shortRoutes, lineOptions));
                  });
                });
            })
          })
        })
    });
  }

  private showMarkers(hospitals: Array<any>) {
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
