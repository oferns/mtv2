import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-map-drawroutes',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class DrawRoutesComponent {

    @Output()
    drawRoutes: EventEmitter<MouseEvent> = new EventEmitter();

    clicked(event: MouseEvent) {
        this.drawRoutes.emit(event);
    }
}
