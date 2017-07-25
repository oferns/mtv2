import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';




@Component({
    selector: 'app-map-clear',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class ClearMapComponent {

    @Output()
    clearMap: EventEmitter<MouseEvent> = new EventEmitter();

    clicked(event: MouseEvent) {
        this.clearMap.emit(event);
    }
}
