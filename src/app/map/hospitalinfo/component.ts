import {
    Component,
    Input,
    Output,
    EventEmitter,
    Inject
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IHospital } from '../../data/ihospital';
import { MdButtonToggleChange } from '@angular/material';

@Component({
    selector: 'app-hospital-info',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalInfoComponent {

    @Input() hospital: IHospital;
    @Input() on: boolean;
    
    @Output() onToggleRoute: EventEmitter<boolean>;

    constructor(private readonly log: Logger) {
        this.log.info('HospitalInfoComponent Ctor called');
        this.onToggleRoute = new EventEmitter<boolean>();
    }

    toggle(event: MdButtonToggleChange) {
        this.onToggleRoute.emit(event.source.checked);
    }
}

