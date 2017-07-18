import { Component, ElementRef, OnInit, OnDestroy, ViewChild, Inject } from '@angular/core';
import { GoogleMapService } from './services/google.map.service';
import { BingMapService } from './services/bing.map.service';

import { IMapService } from '../services/imap.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [{ provide: 'IMapService', useClass: BingMapService }],
})

export class MapComponent implements OnInit, OnDestroy {

  private map;

  @ViewChild('map')
  private mapDivRef: ElementRef

  constructor( @Inject('IMapService') private readonly mapService: IMapService) { }

  // OnInit implementation
  ngOnInit(): void {
    this.map = this.mapService.initMap(this.mapDivRef.nativeElement, {
      zoom: 8,
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
      this.map = _map;
      this.mapService.setCenter(this.map, 38.468589, 21.143545);
    }).catch((err) => {
      console.log(err);
      throw err;
    });


  }
  // End OnInit

  // OnDestroy implementation
  ngOnDestroy(): void {
    // remove private event handlers

  }

  // Map Event Handlers
  private dragendHandler() {

  }
}
