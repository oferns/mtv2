import {
    Component,
    Input,
    Output,
    EventEmitter
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IHospital } from '../../data/ihospital';


@Component({
    selector: 'app-hospital',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalComponent {

    private isLoading: boolean;

    @Input()
    set hospital(hospital: IHospital) {
    }

    constructor(private readonly log: Logger) {

    }
}
