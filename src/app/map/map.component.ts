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
import { IMarkerOptions } from './abstractions/imarker.options';

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

  // Event Handlers
  countryChanged(country: any): void {
    const _me = this;
    const promises = this.providers.map((p) => p.geocode(country.name));
    this.providers.map((p) => p.removeMarkers());

    promises.push(this.hcoService.getHospitals(country.name));

    Promise.all(promises).then((results: any[]) => {
      const hcos: any[] = results[2];
      _me.providers.map((p: IMapService, i: number) => {
        p.setCenter(results[i][0].center);
        p.setBounds(results[i][0].view);
      })

      hcos.forEach((h, i) => {
        _me.providers.map((p) => {
          const options: IMarkerOptions = {
            id: h.id,
            label: h.title,
            onClick: (args) => {
              // alert(args['marker'].id);
              p.drawDrivingRadius(args['marker'], 30);
            }
          };
          const marker = p.setMarker(p.getMarker(p.getLocation(h.lat, h.lng), options));
        })
      })
    }).catch((err) => {
      throw err;
    });
  }

  providerChanged(index: number): void {
    this.currentProviderIndex = index;
  }

  drawDrivingTimeFromMarkerInMinutes(marker: any, minutes: number): void {
    const provider = this.providers[this.currentProviderIndex];

  }
}
