import {
    Component,
    Output,
    EventEmitter,
    Input
} from '@angular/core';

import { IMapService } from '../abstractions/imap.service';


@Component({
    selector: 'app-map-toolbar',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
})


export class ToolbarComponent {

    @Input()
    providers: IMapService[];

    @Output()
    countryChanged: EventEmitter<any> = new EventEmitter();
    @Output()
    providerChanged: EventEmitter<number> = new EventEmitter();
    @Output()
    clearMapClicked: EventEmitter<void> = new EventEmitter();

    countrySelectionChanged(country: any): void {
        this.countryChanged.emit(country);
    }

    providerSelectionChanged(index: number): void {
        this.providerChanged.emit(index);
    }

    clearMap(event: MouseEvent): void {
        this.clearMapClicked.emit();
    }
}



