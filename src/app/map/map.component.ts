import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { } from '@types/googlemaps';

import { DirectionService } from './services/direction.service';


@Component({
  selector: 'hco-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [ DirectionService ],  
})

export class MapComponent implements OnInit {
  
  private map;

  constructor(private readonly el: ElementRef, private dirService: DirectionService) { 
    let x = 1;
  }

  // OnInit implementation
  ngOnInit(): void {
    let el = this.el.nativeElement.getElementsByClassName('map')[0];
    let m = this.map = new google.maps.Map(el, {
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
}