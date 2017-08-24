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
  // Private Map events
  private mapIdle = () => {
    this.log.info('MapComponent mapIdle called');
    if (this.currentCountry) {
      this.log.info('MapComponent mapIdle showing markers');
      this.hospitalMarkers.forEach((marker: any, id: number) => {
        this.currentProvider.toggleMarker(marker, true);
      });
    }
  }

  private mapBoundsChanged = (): void => {
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

    return shape && shape.getMap() ? true : false;

  }

  private markerClicked = (...args: any[]): void => {
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
  // Event Handlers
  // Fires when the country is changed (via the countrypicker)
  countryChanged = (country: ICountry): void => {
    this.log.info(`MapComponent countryChanged to  ${country.name} (${country.id})`);
    this.clearMap();
    this.hospitalMarkers.forEach((v, k) => {
      this.currentProvider.removeMarker(v)
    });
    this.currentProvider.removeClusters();
    this.hospitalMarkers.clear();
    this.hospitalRoutes.clear();
    this.currentCountry = country;
    this.currentProvider.setCenter(this.currentProvider.getLocation(country.center.lat, country.center.lng))
    this.currentProvider.setBounds(country.bounds);

    this.currentHospitals = this.hcoService.getHospitals(country)
      .do((hs: Array<IHospital>) => {
        hs.forEach((h: IHospital) => {
          if ((!h.lat || !h.lng) || (h.lat === 0 && h.lng === 0)) {
            h.visible = false;
          } else {
            h.visible = this.currentProvider.getBounds().contains({ lat: Number(h.lat), lng: Number(h.lng) });
          }
          return h;
        });
      });

    const minutes = 30;

    this.hcoService.getCountryRoutes(country).subscribe(routes => {
      routes.forEach((route: IHospitalRoutes) => {
        this.hospitalRoutes.set(route.id, route);
      });
      this.hospitalsFinished = true;
    });
    //    this.mapIdle();
  }

  // Fires when the Hospital List is loading
  hospitalListLoading = (loading: boolean) => {
    if (this.currentHospitals && !loading) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this._data = hs;
        const markers = hs.map((h: IHospital) => {
          if (this.hospitalMarkers.has(h.id)) {
            return this.hospitalMarkers.get(h.id);
          }

          const options = <IMarkerOptions>{
            id: h.id,
            title: h.name,
            icon: this.pinSymbol(h.strokeCenter ? 'red' : 'white', h.representative ? 1.2 : 1.1),
            onClick: this.markerClicked.bind(this)
          };

          const marker = this.currentProvider.getMarker(this.currentProvider.getLocation(h.lat, h.lng), options);
          this.hospitalMarkers.set(h.id, marker);
          return marker;
        });

        this.toggleCluster(this.cluster);
      });
    }
  }

  toggleRoute = (on: boolean) => {
    this.currentHospitalRoutesVisible = on;
    if (on) {
      this.drawShape(this.currentHospital);
      this.drawLines(this.currentHospital);
    } else {
      this.clearHospital(this.currentHospital)
    }
  }

  toggleRegistered = (on: boolean) => {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {

          hs.forEach((h: IHospital) => {
            if (h.representative) {
              h.visible = on

              const marker = this.hospitalMarkers.get(h.id);
              if (!on) {
                marker.setMap(null)
              } else {
                this.currentProvider.setMarker(marker, true);
              }
            }

          });
          this.zone.run(() => { });
        });
        this.ref.detectChanges();
      });
    }
  }

  toggleStrokeCenters = (on: boolean) => {
    if (this.currentHospitals) {
      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {

          hs.forEach((h: IHospital) => {
            if (h.strokeCenter) {
              h.visible = on
              const marker = this.hospitalMarkers.get(h.id);
              if (!on) {
                marker.setMap(null)
              } else {
                this.currentProvider.setMarker(marker, true);
              }
            }

          });
          this.zone.run(() => { });
        });
        this.ref.detectChanges();
      });
    }
  }

  toggleUnregistered = (on: boolean) => {
    if (this.currentHospitals) {

      this.currentHospitals.subscribe((hs: Array<IHospital>) => {
        this.zone.runOutsideAngular(() => {
          hs.forEach((h: IHospital) => {
            if (!h.representative) {
              h.visible = on
              const marker = this.hospitalMarkers.get(h.id);
              if (!on) {
                marker.setMap(null)
              } else {
                this.currentProvider.setMarker(marker, true);
              }
            }

          });
          this.zone.run(() => { });
        });

        this.ref.detectChanges();
      });
    }
  }


  private clearHospital(hospital: IHospital) {
    if (this.hospitalLines.has(hospital.id)) {
      const lines = this.hospitalLines.get(hospital.id);
      lines.forEach(l => l.setMap(null));
    }

    if (this.hospitalShapes.has(hospital.id)) {
      const shape = this.hospitalShapes.get(hospital.id);
      shape.setMap(null);
    }
  }

  private drawLines(hospital: IHospital): void {
    if (!this.hospitalRoutes.has(hospital.id)) {
      return;
    }

    if (this.hospitalLines.has(hospital.id)) {
      const lines = this.hospitalLines.get(hospital.id);
      lines.forEach(line => {
        if (!line.getMap()) {
          this.currentProvider.setLine(line, true);
        }
      });
      return;
    }

    const routes = this.hospitalRoutes.get(hospital.id);
    const minutes = hospital.strokeCenter ? 45 : 30;
    const p = this.currentProvider;
    const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (minutes * 60)));

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
    const minutes = hospital.strokeCenter ? 45 : 30;
    const p = this.currentProvider;
    const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (minutes * 60)));
    let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
    shapepoints = p.getConvexHull(shapepoints);
    const shapeoptions = p.getShapeOptions({});
    const shape = p.getShape(shapepoints, shapeoptions);
    p.setShape(shape, true);
    this.hospitalShapes.set(routes.id, shape);
  }

  private drawShapeAndLines(hospital: IHospital) {
    if (!this.hospitalRoutes.has(hospital.id)) {
      return;
    }

    if (this.hospitalShapes.has(hospital.id)) {
      const s = this.hospitalShapes.get(hospital.id);
      if (!s.getMap()) {
        this.currentProvider.setShape(s, true);
      }
    }
    const routes = this.hospitalRoutes.get(hospital.id);
    const minutes = 30;
    const p = this.currentProvider;
    const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (minutes * 60)));
    let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
    shapepoints = p.getConvexHull(shapepoints);
    const shapeoptions = p.getShapeOptions({});
    const shape = p.getShape(shapepoints, shapeoptions);
    p.setShape(shape, true);
    this.hospitalShapes.set(routes.id, shape);
    this.hospitalLines.set(routes.id, shortenedRoutes.map((sr: any) => {
      const lineoptions = p.getLineOptions({});
      const linepoints = [].concat.apply([], sr);
      const line = p.getLine(linepoints, lineoptions);
      return p.setLine(line, true);
    }));
  }


  // Fires when a hospital has loaded its routes
  // Responsible for drawing but not displaying shapes & lines
  hospitalLoaded(hospital: IHospital): void {
    const minutes = hospital.strokeCenter ? 45 : 30;
    const p = this.currentProvider;
    hospital.routes.do(r => {
      const shortenedRoutes = r.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (minutes * 60)));
      let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
      shapepoints = p.getConvexHull(shapepoints);
      const shapeoptions = p.getShapeOptions({});
      const shape = p.getShape(shapepoints, shapeoptions);
      p.setShape(shape, false);
      this.hospitalShapes.set(hospital.id, shape);

      shortenedRoutes.forEach((sr: any) => {
        const lineoptions = p.getLineOptions({});
        const linepoints = [].concat.apply([], sr);
        const line = p.getLine(linepoints, lineoptions);
        p.setLine(line, true);
      });
    })
  }

  // Fires when all hospitals have loaded their routes
  hospitalsLoaded(): void {
    this.hospitalsFinished = true;
    this.mapIdle();
  }

  // Fires when the map provider changes
  providerChanged = (provider: IMapService): void => {
    this.currentProvider = provider;
  }


  closeSidenav = (): void => {
    const l = 1;
  }

  openSidenav = (): void => {
    const l = 1;
  }

  private drawLinesAndShapes() {
    setTimeout(() => {

      this.zone.runOutsideAngular(() => {
        this.currentHospitals.subscribe(hospitals => {
          hospitals.forEach(h => {
            if (h.visible && h.inView) {
              if (!this.hospitalRoutes.has(h.id)) {
                return;
              }
              const routes = this.hospitalRoutes.get(h.id);
              const minutes = 30;
              const p = this.currentProvider;
              const shortenedRoutes = routes.radiusDirections.map((d) => p.shortenRouteStepsByDuration(d, (minutes * 60)));
              let shapepoints = shortenedRoutes.reduce((a, b) => a.concat(b));
              shapepoints = p.getConvexHull(shapepoints);
              const shapeoptions = p.getShapeOptions({});
              const shape = p.getShape(shapepoints, shapeoptions);
              p.setShape(shape, true);
              this.hospitalShapes.set(routes.id, shape);
              this.hospitalLines.set(routes.id, shortenedRoutes.map((sr: any) => {
                const lineoptions = p.getLineOptions({});
                const linepoints = [].concat.apply([], sr);
                const line = p.getLine(linepoints, lineoptions);
                return p.setLine(line, true);
              }));
            }
          })

        });
        this.zone.run(() => { });
      });
    }, 50);
  }
  // Fires when the toggle routes button is clicked
  toggleRoutes = (on: boolean): void => {
    this.log.info('MapComponent toggleRoutes called');
    this.drawLinesAndShapes();
    // this.hospitalLines.forEach(lines => lines.forEach(line => this.currentProvider.toggleLine(line, on)));
    // this.hospitalShapes.forEach(shape => this.currentProvider.toggleShape(shape, on));
  }

  toggleCluster = (on: boolean): void => {
    this.cluster = on;
    this.log.info('MapComponent toggleCluster called');
    this.zone.runOutsideAngular(() => {
      if (on) {
        this.hospitalMarkers.forEach(m => this.currentProvider.removeMarker(m));
        this.currentProvider.clusterMarkers(Array.from(this.hospitalMarkers.values()), true);
      } else {
        this.currentProvider.removeClusters();
        this.hospitalMarkers.forEach(m => this.currentProvider.setMarker(m, true));
      }
      this.zone.run(() => { });
    });
  }
  // fires when the clearMap button is clicked
  clearMap = (): void => {
    this.log.info('MapComponent ClearMap called');
    this.zone.runOutsideAngular(() => {
      this.hospitalLines.forEach(lines => lines.forEach(line => line.setMap(null)));
      this.hospitalShapes.forEach(shape => shape.setMap());
    });
    this.zone.run(() => { });
  }
}
