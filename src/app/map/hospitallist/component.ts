import {
    Component,
    Input,
    Output,
    EventEmitter,
    QueryList,
    ElementRef,
    ViewChildren,
    Inject
} from '@angular/core';

import { IHospital } from '../../data/ihospital';
import { ICountry } from '../..//data/icountry';
import { Logger } from 'angular2-logger/core';

import { IHcoService } from '../../services/ihco.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';

@Component({
    selector: 'app-hospital-list',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalListComponent {

    private isLoading: boolean;
    private _country: ICountry;

    get country() {
        return this._country;
    }

    @Input()
    set country(country: ICountry) {
        if (country && country.id > 0) {
            this._country = country;
            this.onHospitalsLoading.emit(this.isLoading = true);
            this.hospitals = this.hcoService.getHospitals(country);
            this.hospitals.do(h => {
                this.log.info(`HospitalListComponent got ${h.length} hospitals for ${country.name}`);
                this.log.info('HospitalListComponent emitting onHospitalsLoading (false)');
                this.onHospitalsLoading.emit(this.isLoading = false);
                this.hospitalCount = h.length;
                this.strokeCenterCount = h.filter(hh => hh.strokeCenter).length;
                this.registeredCount = h.filter(hh => hh.representative && hh.representative.length).length;
                this.registeredStrokeCenters = h.filter(hh => hh.strokeCenter && hh.representative && hh.representative.length).length;
            }).subscribe();
        }
    };

    @Input()
    hospitalCount: number;

    @Input()
    registeredStrokeCenters: number;

    @Input()
    registeredCount: number;

    @Input()
    strokeCenterCount: number;

    @Input()
    hospitals: Observable<Array<IHospital>>;

    @Output()
    onHospitalsLoading: EventEmitter<boolean>;

    @Output()
    onHospitalLoading: EventEmitter<IHospital>;

    @Output()
    onHospitalLoaded: EventEmitter<IHospital>;

    @Input()
    mapBounds: any;

    @ViewChildren('hospital') private hospitalElements: QueryList<HospitalListComponent>;

    constructor(
        @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        log.info('HospitalList Component CTor called');
        this.onHospitalsLoading = new EventEmitter<boolean>();
        this.onHospitalLoading = new EventEmitter<IHospital>();
        this.onHospitalLoaded = new EventEmitter<IHospital>();
    }

    visibleCount = (): number => {
        return this.hospitalElements ? this.hospitalElements.length : 0;
    }

    private hospitalLoading(hospital: IHospital) {
        this.onHospitalLoading.emit(hospital);
    }

    private hospitalLoaded(hospital: IHospital) {
        this.onHospitalLoaded.emit(hospital);
    }
}
