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

    private _hospital: IHospital;

    get hospital(): IHospital {
        return this._hospital;
    }

    @Input()
    set hospital(hospital: IHospital) {
        this._hospital = hospital;
        this.isLoading = true;
        this.onHospitalLoading.emit(hospital);
        this.hcoService.getHospitalRoutes(hospital)
            .subscribe(hs => {
                this.isLoading = false;
                if (hs) {
                    hs.radiusDirections = hs.radiusDirections || [];
                    this.log.info(`HospitalComponent ${hs.radiusDirections.length} routes received`);
                    hospital.radiusDirections = hs.radiusDirections;
                } else {
                    this.log.info(`HospitalComponent no routes received`);
                }
                this.onHospitalLoaded.emit(hospital);
            })
    }

    @Input()
    isLoading: boolean;

    @Output()
    onHospitalLoading: EventEmitter<IHospital>;

    @Output()
    onHospitalLoaded: EventEmitter<IHospital>;

    @Input()
    set mapBounds(bounds: any) {
        if ((!this._hospital.lat || this._hospital.lng) || (this._hospital.lat === 0 && this._hospital.lng === 0)) {
            this._hospital.visible = false;
        }
        this._hospital.visible = bounds.contains({ lat: Number(this._hospital.lat), lng: Number(this._hospital.lng) });
    };

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger) {
        this.log.info('HospitalComponent Ctor called');
        this.onHospitalLoading = new EventEmitter<IHospital>();
        this.onHospitalLoaded = new EventEmitter<IHospital>();
    }
}
