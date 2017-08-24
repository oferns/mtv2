import {
    Component,
    Output,
    EventEmitter,
    Input
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IMapService } from '../abstractions/imap.service';
import { ICountry } from '../../data/icountry';


@Component({
    selector: 'app-map-toolbar',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
})


export class ToolbarComponent {

    @Input() set hospitalsLoaded(hospitalsLoaded: boolean) {
        this.disableDrawRoutes = !hospitalsLoaded;
    };

    @Input() providers: Array<IMapService>;
    @Output() disableDrawRoutes: boolean;
    @Input() isLoading: boolean;

    @Output() onCountryChanged: EventEmitter<ICountry>;
    @Output() onProviderChanged: EventEmitter<IMapService>;
    @Output() onClearMapClicked: EventEmitter<void>;
    @Output() onToggleRoutes: EventEmitter<boolean>;
    @Output() onToggleCluster: EventEmitter<boolean>;

    constructor(private readonly log: Logger) {

        this.onCountryChanged = new EventEmitter<ICountry>();
        this.onProviderChanged = new EventEmitter<IMapService>();
        this.onClearMapClicked = new EventEmitter<void>();
        this.onToggleRoutes = new EventEmitter<boolean>();
        this.onToggleCluster = new EventEmitter<boolean>();

    }
    countryChanged(country: ICountry) {
        this.onCountryChanged.emit(country);
    }

    providerChanged(provider: IMapService): void {
        this.onProviderChanged.emit(provider);
    }

    clearMap(event: MouseEvent): void {
        this.onClearMapClicked.emit();
    }

    toggleRoutes(on: boolean): void {
        this.onToggleRoutes.emit(on);
    }

    toggleCluster(on: boolean): void {
        this.onToggleCluster.emit(on);
    }
}
