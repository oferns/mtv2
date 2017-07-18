import { Component, ElementRef, OnInit, ViewChild, Inject } from '@angular/core';
import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';

import { IMapService } from '../services/imap.service';
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
    console.log('fuck me');
  }

  // Map Event Handlers
  private dragendHandler() {

  }
}
