import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { } from '@types/googlemaps';

import { DirectionService } from './services/direction.service';


@Component({
  selector: 'hco-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [DirectionService],
})

export class MapComponent implements OnInit {

  private map;
  private container: Element;

  constructor(private readonly parentRef: ElementRef, private dirService: DirectionService) { }

  // OnInit implementation
  ngOnInit(): void {
    this.container = this.parentRef.nativeElement.getElementsByClassName('map')[0];

    let m = this.map = new google.maps.Map(this.container, {
      center: new google.maps.LatLng(38.468589, 21.143545),
      zoom: 8,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.TOP_RIGHT
      },
      mapTypeControl: true,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: false
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

  private pinSymbol(color) {
    return {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#000',
      strokeWeight: 1,
      scale: 1,
      labelOrigin: new google.maps.Point(0, -29)
    };
  }
}