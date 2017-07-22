import { Component, OnInit, Inject, Input, Output, EventEmitter } from '@angular/core';
import { IMapService } from '../abstractions/imap.service';

@Component({
    selector: 'app-map-provider',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    providers: []
})

export class ProviderPickerComponent {

    @Input()
    providers: IMapService[] = [];

    @Output()
    selectionChanged: EventEmitter<number> = new EventEmitter();

    private readonly RadioGroupName: string;

    constructor() {
        this.RadioGroupName = 'SomeUniqueIdGen';
    }

    selectItem(value: number): void {
        this.selectionChanged.emit(value);
    }
}
