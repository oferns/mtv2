import {
    Component
    , OnInit
    , Input
    , Output
    , EventEmitter
    , Inject
    , InjectionToken
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IMapService } from '../../abstractions/imap.service';

export const PROVIDERS = new InjectionToken<IMapService>('IMapService');

@Component({
    selector: 'app-map-provider',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class ProviderPickerComponent {

    @Output()
    onProviderChanged: EventEmitter<IMapService>;

    constructor(
        @Inject(PROVIDERS) readonly providers: Array<IMapService>,
        private readonly log: Logger) {
        this.onProviderChanged = new EventEmitter<IMapService>();
    }

    providerChanged(value: IMapService): void {
        this.onProviderChanged.emit(value);
    }
}
