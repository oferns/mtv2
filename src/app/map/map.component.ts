import {
  Component,
  ElementRef,
  AfterViewInit,
  AfterViewChecked,
  ViewChild,
  ViewChildren,
  Inject,
  InjectionToken,
  QueryList
} from '@angular/core';

import { IMapService } from './abstractions/imap.service';
import { IHcoService } from '../services/ihco.service';

export const PROVIDERS = new InjectionToken<IMapService>('IMapService');

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})

export class MapComponent implements AfterViewInit {

  @ViewChildren('map') private mapContainersRef: QueryList<ElementRef>

  private mapService: IMapService;
  private currentProviderIndex = 0;

  constructor(
    @Inject(PROVIDERS) private readonly providers: IMapService[],
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) { }

  // OnInit implementation
  ngAfterViewInit(): void {
    this.mapContainersRef.forEach((div: ElementRef, index: number) => {
      const provider = this.providers[index];
      provider.initMap(div.nativeElement, {}).then((_map) => {
        provider.setCenter(38.468589, 21.143545);
        provider.setZoom(8);
      }).catch((err) => {
        throw err;
      });
    })

    // this.mapService.initMap(this.mapsContainerRef.nativeElement, {
    //   disableDefaultUI: true,
    //   zoomControl: true,
    //   zoomControlOptions: {
    //     position: 'TOP_RIGHT'
    //   },
    //   mapTypeControl: true,
    //   scaleControl: true,
    //   streetViewControl: false,
    //   rotateControl: true,
    //   fullscreenControl: false
    // }).then((_map) => {
    //   this.mapService.setCenter(38.468589, 21.143545);
    //   this.mapService.setZoom(4);
    // }).catch((err) => {
    //   console.log(err);
    //   throw err;
    // });
  }
  // End OnInit

  // Event Handlers
  countryChanged(country: any): void {
    const p1 = new Promise((res, rej) => {
      if (country.id && country.id > -1) {
        this.mapService.geocode(country.name).then((results) => {
          this.mapService.setBounds(results[0].view);
          return res();
        }).catch((err) => rej(err))
      }
    });

    Promise.all([p1, this.hcoService.getHospitals(country.id)]).
      then((results: any[]) => {

        for (const result of results[1]) {
          const marker = this.mapService.getMarker(result.lat, result.lng, {});
          this.mapService.setMarker(marker);
        }
      });

  }

  providerChanged(index: number): void {
    this.currentProviderIndex = index;
  }
}
