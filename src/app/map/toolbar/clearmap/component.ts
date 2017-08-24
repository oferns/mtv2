import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { Logger } from 'angular2-logger/core';

@Component({
    selector: 'app-map-clear',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class ClearMapComponent {

    @Output()
    clearMap: EventEmitter<MouseEvent>;

    constructor(private readonly log: Logger) {
        this.clearMap = new EventEmitter<MouseEvent>()
    }
    
    clicked(event: MouseEvent) {
        this.clearMap.emit(event);
    }
}
