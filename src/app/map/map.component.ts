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
import { IGeoCodeResult } from './abstractions/igeocode.result';

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

  constructor(
    @Inject(PROVIDERS) private readonly providers: IMapService[],
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) { }

  // OnInit implementation
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
    const _me = this;
    const promises = this.providers.map((p) => p.geocode(country.name));
    promises.push(this.hcoService.getHospitals(country.id));
    Promise.all(promises).then((results: any[]) => {
      const hcos: any[] = results[2];
      _me.providers.map((p: IMapService, i: number) => {
        p.setCenter(results[i][0].center);
        p.setBounds(results[i][0].view);
      })

      const markers = hcos.map((h, i) => {
        _me.providers.map((p) => {
          return p.setMarker(p.getMarker(h.lat, h.lng, { label: h.title }));
        })
      })
    }).catch((err) => {
      throw err;
    });
  }

  providerChanged(index: number): void {
    this.currentProviderIndex = index;
  }
}
