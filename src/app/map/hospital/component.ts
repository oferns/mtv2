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


@Component({
    selector: 'app-hospital',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalComponent {

    @Input()
    isLoading: boolean;

    private _hospital: IHospital;

    get hospital(): IHospital {
        return this._hospital;
    }
    @Input()
    set hospital(hospital: IHospital) {
        this._hospital = hospital;
        this.hospitalLoading.emit(this.isLoading = true);
        this.hcoService.getHospitalRoutes(hospital)
            .do(h => {
                this.log.debug(`HospitalComponent got ${hospital.name} routes data ${h.data}`)
            })
            .subscribe(hs => {
                this.hospitalLoading.emit(this.isLoading = false);
                this._hospital.radiusDirections = hs[0].radiusDirections;
            })
    }

    @Output()
    hospitalLoading: EventEmitter<boolean>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger) {
        this.log.debug('HospitalComponent Ctor called');
        this.hospitalLoading = new EventEmitter<boolean>();
    }
}
