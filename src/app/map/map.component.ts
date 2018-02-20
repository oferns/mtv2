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
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import {
  trigger,
  state,
  animate,
  transition,
  style
} from '@angular/animations';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';

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
import { IHospitalRoutes } from 'app/data/ihospitalroutes';

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

  private hospitalMarkers: Map<number, any> = new Map<number, any>();
  private hospitalShapes: Map<number, any> = new Map<number, any>();
  private hospitalLines: Map<number, any[]> = new Map<number, any[]>();
  private hospitalRoutes: Map<number, IHospitalRoutes> = new Map<number, IHospitalRoutes>();
  private timeout: number;
  private cluster: boolean;
  private currentProvider: IMapService;
  private _data: Array<IHospital>;
  private infoWindow: any;

  @Output() loadStarted: EventEmitter<void> = new EventEmitter();
  @Output() loadFinished: EventEmitter<void> = new EventEmitter();
  @Output() boundsChanged: EventEmitter<any> = new EventEmitter();
  @Output() dragEnd: EventEmitter<any> = new EventEmitter();
  @Output() hospitalsFinished: boolean;

  @Output() currentCountry: ICountry;
  @Output() currentHospitals: Observable<IHospital[]>;
  @Output() currentRoutes: Observable<IHospitalRoutes[]>;
  @Output() currentHospital: IHospital;
  @Output() currentHospitalRoutesVisible: boolean;

  @ViewChildren('map') private mapDivRefs: QueryList<ElementRef>
  @ViewChild('hospitalInfo') private hospitalInfoElement: ElementRef;

  constructor(
    private readonly log: Logger,
    private readonly ref: ChangeDetectorRef,
    private readonly zone: NgZone,
    @Inject(PROVIDERS) readonly providers: Array<IMapService>,
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) {
    this.log.info('MapComponent constructor called');
    this.currentProvider = providers[0];
  }

  ngAfterViewInit(): void {
    this.log.info('MapComponent ngAfterViewInit called');

    this.mapDivRefs.map((div: ElementRef, index: number) => {
      const provider = this.providers[index];

      provider.onReady().then(() => provider.initMap(div.nativeElement, provider.getOptions({})).then((_map) => {
        provider.setCenter(provider.getLocation(38.468589, 21.143545));
        provider.setZoom(8);
        provider.addListener('bounds_changed', this.mapBoundsChanged.bind(this));
      }).catch((err) => {
        this.log.error(`MapComponent: Error initializing map provider ${err}`);
        throw err;
      }));
    })
  }

  // Event Handlers
  // Fires when the country is changed (via the countrypicker)
  countryChanged(country: ICountry): void {
    this.log.info(`MapComponent countryChanged to  ${country.name} (${country.id})`);
    this.clearMap();
    this.hospitalMarkers.forEach((v, k) => {
      this.currentProvider.setMarker(v, false)
    });
    this.currentProvider.removeClusters();
    this.hospitalMarkers.clear();
    this.hospitalRoutes.clear();
    this.currentCountry = country;
    this.currentProvider.setCenter(this.currentProvider.getLocation(country.center.lat, country.center.lng))
    this.currentProvider.setBounds(country.bounds);

    this.currentHospitals = this.hcoService.getHospitals(country)
      .do((hs: IHospital[]) => {
        hs.forEach((h: IHospital) => {
          if ((!h.lat || !h.lng) || (h.lat === 0 && h.lng === 0)) {
            h.visible = false;
          } else {
            h.visible = this.currentProvider.getBounds().contains({ lat: Number(h.lat), lng: Number(h.lng) });
          }
        });
      });

    this.hcoService.getCountryRoutes(country).subscribe(routes => {
      routes.forEach((route: IHospitalRoutes) => {
        this.hospitalRoutes.set(route.id, route);
      });
      this.hospitalsFinished = true;
    });

  }

  // Fires when the Hospital List is loading
  hospitalListLoading(loading: boolean): void {
    if (this.currentHospitals && !loading) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this._data = hs;
        const markers = hs.map((h: IHospital) => {
          if (this.hospitalMarkers.has(h.id)) {
            return this.hospitalMarkers.get(h.id);
          }

          let color = 'white';
          if (h.registered) {
            color = 'grey';
          } else {
            color = h.treatingNoAngels ? 'yellow' : color;
            color = h.futureTarget ? 'red' : color;
          }

          const options = <IMarkerOptions>{
            id: h.id,
            title: h.name,
            icon: this.pinSymbol(color, h.representative ? 1.2 : 1.1),
            onClick: this.markerClicked.bind(this)
          };

          const marker = this.currentProvider.getMarker(this.currentProvider.getLocation(h.lat, h.lng), options);
          this.hospitalMarkers.set(h.id, marker);
          return marker;
        });

        this.zone.runOutsideAngular(() => {

          this.hospitalMarkers.forEach((k, v) => {
            const hos = this._data.find(d => d.id === v);
            this.currentProvider.setMarker(k, hos.visible);
          });
        })
      });
    }
  }

  filterChanged(term: string) {
    this.zone.runOutsideAngular(() => {

      this.hospitalMarkers.forEach((k, v) => {
        const hos = this._data.find(d => d.id === v);
        hos.visible = hos.name.toLowerCase().indexOf(term.toLowerCase()) > -1;
        this.currentProvider.setMarker(k, hos.visible);
      });
    })
  }

  hospitalMouseEnter(event: IHospital) {
    if (this.hospitalMarkers.has(event.id)) {
      const m = this.hospitalMarkers.get(event.id);
      m.setAnimation(1);
    }
  }

  hospitalMouseLeave(event: IHospital) {
    if (this.hospitalMarkers.has(event.id)) {
      const m = this.hospitalMarkers.get(event.id);
      m.setAnimation(null);
    }
  }

  toggleRoute(on: boolean): void {
    this.currentHospitalRoutesVisible = on;
    if (on) {
      this.drawShape(this.currentHospital);
      this.drawLines(this.currentHospital);
    } else {
      this.clearHospital(this.currentHospital)
    }
  }

  toggleRegistered(on: boolean): void {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {

          hs.forEach((h: IHospital) => {
            if (h.registered) {
              h.visible = on

              const marker = this.hospitalMarkers.get(h.id);
              const shape = this.hospitalShapes.get(h.id);
              const lines = this.hospitalLines.get(h.id);

              this.currentProvider.setMarker(marker, on);
              if (shape) {
                this.currentProvider.setShape(shape, on);
              }
              if (lines) {
                lines.forEach(l => {
                  this.currentProvider.setLine(l, on);
                });
              }
            }
          });
          //       this.zone.run(() => { });
        });
        this.currentHospitals = Observable.of(hs);
        this.ref.detectChanges();
      });
    }
  }

  toggleTreatingNoAngelss(on: boolean): void {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {

          hs.forEach((h: IHospital) => {
            if (h.treatingNoAngels && !h.futureTarget) {
              h.visible = on

              const marker = this.hospitalMarkers.get(h.id);
              const shape = this.hospitalShapes.get(h.id);
              const lines = this.hospitalLines.get(h.id);

              this.currentProvider.setMarker(marker, on);
              if (shape) {
                this.currentProvider.setShape(shape, on);
              }
              if (lines) {
                lines.forEach(l => {
                  this.currentProvider.setLine(l, on);
                });
              }
            }

          });
        });
        this.currentHospitals = Observable.of(hs);
        this.ref.detectChanges();
      });
    }
  }

  toggleFutureTargets(on: boolean): void {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {

          hs.forEach((h: IHospital) => {
            if (h.futureTarget && !h.treatingNoAngels) {
              h.visible = on

              const marker = this.hospitalMarkers.get(h.id);
              const shape = this.hospitalShapes.get(h.id);
              const lines = this.hospitalLines.get(h.id);

              this.currentProvider.setMarker(marker, on);
              if (shape) {
                this.currentProvider.setShape(shape, on);
              }
              if (lines) {
                lines.forEach(l => {
                  this.currentProvider.setLine(l, on);
                });
              }
            }

          });
        });
        this.currentHospitals = Observable.of(hs);
        this.ref.detectChanges();
      });
    }
  }


  toggleUnregistered(on: boolean): void {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {
          hs.forEach((h: IHospital) => {
            if (!h.registered && !h.futureTarget && !h.treatingNoAngels) {
              h.visible = on

              const marker = this.hospitalMarkers.get(h.id);
              const shape = this.hospitalShapes.get(h.id);
              const lines = this.hospitalLines.get(h.id);

              this.currentProvider.setMarker(marker, on);
              if (shape) {
                this.currentProvider.setShape(shape, on);
              }
              if (lines) {
                lines.forEach(l => {
                  this.currentProvider.setLine(l, on);
                });
              }
            }
          });
        });
        this.currentHospitals = Observable.of(hs);
        this.ref.detectChanges();
      });
    }
  }


  toggleTreatingNoAngels(on: boolean): void {
    this.currentHospital.treatingNoAngels = on;
    const hospital = this.currentHospital;
    this.log.info(`MapComponent toggleTreatingNoAngels to ${hospital.name} (${hospital.id})`);
    if (this.hospitalMarkers.has(hospital.id)) {
      const marker = this.hospitalMarkers.get(hospital.id);
      let color = 'white';
      if (hospital.registered) {
        color = 'grey'
      } else {
        color = on ? 'yellow' : color;
      }
      marker.setIcon(this.pinSymbol(color, hospital.representative ? 1.2 : 1));
      this.ref.detectChanges();
    }
  }

  toggleFutureTarget(on: boolean): void {
    this.currentHospital.futureTarget = on;
    const hospital = this.currentHospital;
    this.log.info(`MapComponent toggleFutureTarget to ${hospital.name} (${hospital.id})`);
    if (this.hospitalMarkers.has(hospital.id)) {
      const marker = this.hospitalMarkers.get(hospital.id);
      let color = 'white';
      if (hospital.registered) {
        color = 'grey'
      } else {
        color = on ? 'red' : color;
      }
      marker.setIcon(this.pinSymbol(color, hospital.representative ? 1.2 : 1.1));
      this.ref.detectChanges();
    }
  }

  // Fires when the toggle routes button is clicked
  toggleRoutes(on: boolean): void {
    this.log.info(`MapComponent toggleRoutes called ${on}`);

    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {
          setTimeout(() => {
            hs.filter(h => h.visible && h.inView).forEach(h => {
              if (on) {
                this.drawShape(h);
                this.drawLines(h);
              } else {
                this.clearHospital(h);
              }
            });
          });
        });
      });
    }
  }

  toggleCluster(on: boolean): void {
    this.cluster = on;
    this.log.info(`MapComponent toggleCluster called  ${on}`);
    this.zone.runOutsideAngular(() => {
      if (on) {
        this.hospitalMarkers.forEach(m => this.currentProvider.toggleMarker(m, on));
        this.currentProvider.clusterMarkers(Array.from(this.hospitalMarkers.values()), true);
      } else {
        this.currentProvider.removeClusters();
        this.hospitalMarkers.forEach(m => {
          this.currentProvider.setMarker(m, !on);
        });
      }
      // this.zone.run(() => { });
    });
    this.ref.detectChanges();
  }
  // fires when the clearMap button is clicked
  clearMap(): void {
    this.log.info('MapComponent ClearMap called');
    this.zone.runOutsideAngular(() => {
      this.hospitalLines.forEach(lines => lines.forEach(line => this.currentProvider.setLine(line, false)));
      this.hospitalShapes.forEach(shape => this.currentProvider.setShape(shape, false));
    });
    // this.zone.run(() => { });
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

  private mapBoundsChanged(): void {
    window.clearTimeout(this.timeout);
    this.timeout = window.setTimeout(() => {
      this.log.info('MapComponent mapBoundsChanged called');

      if (this.currentHospitals) {
        this.currentHospitals.subscribe((hs: Array<IHospital>) => {
          hs.forEach((h: IHospital) => {
            if ((!h.lat || !h.lng) || (Number(h.lat) === 0 && Number(h.lng) === 0)) {
              h.inView = false;
            } else {
              h.inView = this.currentProvider.getBounds().contains({ lat: Number(h.lat), lng: Number(h.lng) });
            }
            return h;
          });
          this.ref.detectChanges();
        });
      }
      this.boundsChanged.emit(this.currentProvider.getBounds());
    }, 50);
  }

  private shapesAndLinesVisible(hospital: IHospital): boolean {
    const shape = this.hospitalShapes.get(hospital.id);
    return shape && shape.getMap();
  }

  private markerClicked(...args: any[]): void {
    if (this.infoWindow) {
      this.infoWindow.close();
    }
    const a = args[0].args;
    const marker = args[0].marker;
    this.currentHospital = this._data.find(h => h.name === marker.title);
    this.currentHospitalRoutesVisible = this.shapesAndLinesVisible(this.currentHospital);

    this.ref.detectChanges();

    const options = this.currentProvider.getInfoWindowOptions(marker.getPosition());

    const window = this.currentProvider.getInfoWindow(options);
    window.setContent(this.hospitalInfoElement.nativeElement);
    this.currentProvider.setInfoWindow(this.infoWindow = window);
  }

  private clearHospital(hospital: IHospital): void {
    if (this.hospitalLines.has(hospital.id)) {
      const lines = this.hospitalLines.get(hospital.id);
      lines.forEach(l => this.currentProvider.setLine(l, false));
    }

    if (this.hospitalShapes.has(hospital.id)) {
      const shape = this.hospitalShapes.get(hospital.id);
      this.currentProvider.toggleShape(shape, false);
    }
  }

  private drawLines(hospital: IHospital): void {
    if (!this.hospitalRoutes.has(hospital.id)) {
      return;
    }

    if (this.hospitalLines.has(hospital.id)) {
      const lines = this.hospitalLines.get(hospital.id);
      lines.forEach(line => {
        this.currentProvider.setLine(line, true);
      });
      return;
    }

    const routes = this.hospitalRoutes.get(hospital.id);
    const p = this.currentProvider;
    const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (30 * 60)));

    this.hospitalLines.set(routes.id, shortenedRoutes.map((sr: any) => {
      const lineoptions = p.getLineOptions({});
      const linepoints = [].concat.apply([], sr);
      const line = p.getLine(linepoints, lineoptions);
      return p.setLine(line, true);
    }));
  }

  private drawShape(hospital: IHospital): void {
    if (!this.hospitalRoutes.has(hospital.id)) {
      return;
    }

    if (this.hospitalShapes.has(hospital.id)) {
      const s = this.hospitalShapes.get(hospital.id);
      if (!s.getMap()) {
        this.currentProvider.setShape(s, true);
        return;
      }
    }

    const routes = this.hospitalRoutes.get(hospital.id);
    const p = this.currentProvider;
    const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (30 * 60)));
    let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
    shapepoints = p.getConvexHull(shapepoints);
    const shapeoptions = p.getShapeOptions({});
    const shape = p.getShape(shapepoints, shapeoptions);
    p.setShape(shape, true);
    this.hospitalShapes.set(routes.id, shape);
  }
}
