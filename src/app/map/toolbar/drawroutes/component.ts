import { Component, OnInit, Inject, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MdButtonToggleChange } from '@angular/material';
import { MdButtonToggle } from '@angular/material';

@Component({
    selector: 'app-map-drawroutes',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class DrawRoutesComponent {

    @ViewChild(MdButtonToggle)
    button: MdButtonToggle;

    @Input()
    disabled: boolean;

    @Output()
    onToggleRoutes: EventEmitter<boolean>;

    constructor() {
        this.onToggleRoutes = new EventEmitter<boolean>();
    }

    toggle(event: MdButtonToggleChange) {
        this.onToggleRoutes.emit(event.source.checked);
    }
}
