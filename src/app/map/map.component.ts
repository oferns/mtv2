import { Component, ElementRef, OnInit, ViewChild, Inject } from '@angular/core';

import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';

import { IMapService } from './abstractions/imap.service';
import { IHcoService } from '../services/ihco.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [{ provide: 'IMapService', useClass: GoogleMapService }]
})

export class MapComponent implements OnInit {

  @ViewChild('map')
  private mapDivRef: ElementRef

  constructor(
    @Inject('IMapService') private readonly mapService: IMapService,
    @Inject('IHcoService') private readonly hcoService: IHcoService
  ) { }

  // OnInit implementation
  ngOnInit(): void {
    this.mapService.initMap(this.mapDivRef.nativeElement, {
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: 'TOP_RIGHT'
      },
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: false
    }).then((_map) => {
      this.mapService.setCenter(38.468589, 21.143545);
      this.mapService.setZoom(4);
    }).catch((err) => {
      console.log(err);
      throw err;
    });
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
}
