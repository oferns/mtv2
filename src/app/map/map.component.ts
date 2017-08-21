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
  private timeout: number;
  private currentProvider: IMapService;

  @Output() loadStarted: EventEmitter<void> = new EventEmitter();
  @Output() loadFinished: EventEmitter<void> = new EventEmitter();
  @Output() boundsChanged: EventEmitter<any> = new EventEmitter();
  @Output() dragEnd: EventEmitter<any> = new EventEmitter();
  @Output() hospitalsFinished: boolean;

  @Output() currentCountry: ICountry;
  @Output() currentHospitals: Observable<IHospital[]>;

  @ViewChildren('map') private mapDivRefs: QueryList<ElementRef>

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
      return provider.initMap(div.nativeElement, {}).then((_map) => {
        provider.setCenter(provider.getLocation(38.468589, 21.143545));
        provider.setZoom(8);
        provider.addListener('bounds_changed', this.mapBoundsChanged.bind(this));
      }).catch((err) => {
        this.log.error(`MapComponent: Error initializing map provider ${err}`);
        throw err;
      });
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

  private jogMap() {
    this.log.info('MapComponent mapIdle called');
    const cnt = this.currentProvider.getCenter();
    const lat = cnt.lat()
    const lng = cnt.lng();

    this.currentProvider.setCenter(this.currentProvider.getLocation((Number(lat) + 0.000001), Number(lng)));
    this.currentProvider.setCenter(this.currentProvider.getLocation(lat, lng));
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
              h.visible = false;
            } else {
              h.visible = this.currentProvider.getBounds().contains({ lat: Number(h.lat), lng: Number(h.lng) });
            }
            return h;
          });
          this.ref.detectChanges();
        });
      }
      this.boundsChanged.emit(this.currentProvider.getBounds());
    }, 50);
  }

  // Event Handlers
  // Fires when the country is changed (via the countrypicker)
  countryChanged = (country: ICountry): void => {
    this.log.info(`MapComponent countryChanged to  ${country.name} (${country.id})`);
    this.currentCountry = country;
    this.currentProvider.setCenter(this.currentProvider.getLocation(country.center.lat, country.center.lng))
    this.currentProvider.setBounds(country.bounds);

    this.currentHospitals = this.hcoService.getHospitals(country)
      .do((hs: Array<IHospital>) => {

        this.currentHospitals = Observable.of<Array<IHospital>>(hs.map<IHospital>((h: IHospital) => {
          if ((!h.lat || !h.lng) || (h.lat === 0 && h.lng === 0)) {
            h.visible = false;
          } else {
            h.visible = this.currentProvider.getBounds().contains({ lat: Number(h.lat), lng: Number(h.lng) });
          }
          return h;
        }));
      });
    this.mapIdle();
  }

  // Fires when the Hospital List is loading
  hospitalListLoading = (loading: boolean) => {
    if (this.currentHospitals && !loading) {
      this.zone.runOutsideAngular(() => {
        this.currentHospitals.subscribe((hs: Array<IHospital>) => {
          hs.map((h: IHospital) => {
            if (this.hospitalMarkers.has(h.id)) {
              return;
            }

            const options = <IMarkerOptions>{
              title: h.name,
              icon: this.pinSymbol(h.strokeCenter ? 'red' : 'white', h.representative ? 1.2 : 1.1)
            };

            const marker = this.currentProvider.getMarker(this.currentProvider.getLocation(h.lat, h.lng), options);
            this.currentProvider.setMarker(marker, true);
            this.hospitalMarkers.set(h.id, marker);
            this.zone.run(() => h.routes);
          });
        });
      });

      setTimeout(() => this.mapIdle(), 20);
      // this.currentHospitals.mergeMap(hs => {
      //   return hs.map(h => h.routes);
      // }, null, 5).subscribe(r => {
      //   const l = r;
      // })
    }
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

      const lines = [];
      shortenedRoutes.forEach((sr: any) => {
        const lineoptions = p.getLineOptions({});
        const linepoints = [].concat.apply([], sr);
        const line = p.getLine(linepoints, lineoptions);
        lines.push(p.setLine(line, false));
      });

      this.hospitalLines.set(hospital.id, lines);
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

  // Fires when the toggle routes button is clicked
  toggleRoutes = (on: boolean): void => {
    this.log.info('MapComponent toggleRoutes called');
    this.hospitalLines.forEach(lines => lines.forEach(line => this.currentProvider.toggleLine(line, on)));
    this.hospitalShapes.forEach(shape => this.currentProvider.toggleShape(shape, on));
  }

  // fires when the clearMap button is clicked
  clearMap = (): void => {
    this.log.info('MapComponent ClearMap called');
    this.hospitalLines.forEach(lines => lines.forEach(line => this.currentProvider.toggleLine(line, false)));
    this.hospitalShapes.forEach(shape => this.currentProvider.toggleShape(shape, false));
  }
}
