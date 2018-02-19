import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';
import { MatButtonToggle } from '@angular/material';

@Component({
    selector: 'app-map-drawroutes',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class DrawRoutesComponent {

    @ViewChild(MatButtonToggle)
    button: MatButtonToggle;

    @Input()
    disabled: boolean;

    @Output()
    onToggleRoutes: EventEmitter<boolean>;

    constructor() {
        this.onToggleRoutes = new EventEmitter<boolean>();
    }

    toggle(event: MatButtonToggleChange) {
        this.onToggleRoutes.emit(event.source.checked);
    }
}
