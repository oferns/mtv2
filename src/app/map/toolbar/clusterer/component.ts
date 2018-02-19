import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material';
import { MatButtonToggle } from '@angular/material';

@Component({
    selector: 'app-map-clusterer',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class ClustererComponent {

    @ViewChild(MatButtonToggle)
    button: MatButtonToggle;

    @Input()
    disabled: boolean;

    @Output()
    onToggleCluster: EventEmitter<boolean>;

    constructor() {
        this.onToggleCluster = new EventEmitter<boolean>();
    }

    toggle(event: MatButtonToggleChange) {
        this.onToggleCluster.emit(event.source.checked);
    }
}
