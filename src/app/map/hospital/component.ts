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

    private _hospital: IHospital;

    get hospital(): IHospital {
        return this._hospital;
    }

    @Input()
    set hospital(hospital: IHospital) {
        this._hospital = hospital;
        this.isLoading = true;
        this.onHospitalLoading.emit(hospital);
        this.hcoService.getHospitalRoutes(hospital).subscribe((r: IHospitalRoutes) => {
            this.log.info('Getting routes');
            hospital.radiusDirections = r.radiusDirections;
            this.isLoading = false;
            this.onHospitalLoaded.emit(hospital);
        });
    };

    @Input()
    isLoading: boolean;

    @Output()
    onHospitalLoading: EventEmitter<IHospital>;

    @Output()
    onHospitalLoaded: EventEmitter<IHospital>;

    routes: Observable<IHospitalRoutes>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger) {
        // this.log.info('HospitalComponent Ctor called');
        this.onHospitalLoading = new EventEmitter<IHospital>();
        this.onHospitalLoaded = new EventEmitter<IHospital>();
    }
}
