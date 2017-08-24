import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MdButtonToggleChange } from '@angular/material';
import { MdButtonToggle } from '@angular/material';

@Component({
    selector: 'app-map-clusterer',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class ClustererComponent {

    @ViewChild(MdButtonToggle)
    button: MdButtonToggle;

    @Input()
    disabled: boolean;

    @Output()
    onToggleCluster: EventEmitter<boolean>;

    constructor() {
        this.onToggleCluster = new EventEmitter<boolean>();
    }

    toggle(event: MdButtonToggleChange) {
        this.onToggleCluster.emit(event.source.checked);
    }
}
