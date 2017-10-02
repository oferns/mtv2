import {
    Component,
    Input,
    Output,
    EventEmitter,
    Inject
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IHospital } from '../../data/ihospital';
import { IHcoService } from '../../services/ihco.service';
import { Observable } from 'rxjs/Observable';
import { IHospitalRoutes } from '../../data/ihospitalroutes';


@Component({
    selector: 'app-hospital',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalComponent {

    @Input() hospital: IHospital;
    @Input() isLoading: boolean;

    constructor(private readonly log: Logger) {
        // this.log.info('HospitalComponent Ctor called');
    }
}
