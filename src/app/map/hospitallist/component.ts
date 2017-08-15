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
            this.hospitals = this.hcoService.getHospitals(country)
            this.hospitals.do(h => {
                this.log.info(`HospitalListComponent got ${h.length} hospitals for ${country.name}`);
                this.onHospitalsLoading.emit(this.isLoading = false);
            }).subscribe();
        }
    };

    @Input()
    hospitals: Observable<Array<IHospital>>;

    @Output()
    onHospitalsLoading: EventEmitter<boolean>;

    @Output()
    onHospitalLoading: EventEmitter<IHospital>;

    @Output()
    onHospitalLoaded: EventEmitter<IHospital>;

    @Input()
    set mapBounds(bounds: any) {
        if (this.hospitals) {
            this.hospitals.forEach(hospitals => {
                hospitals.forEach(hospital => {
                    hospital.visible = bounds.contains({ lat: Number(hospital.lat || 0), lng: Number(hospital.lng || 0) });
                });
            });
        }
    };

    @ViewChildren('#hospital') private hospitalElements: QueryList<ElementRef>;

    constructor(
        @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        log.info('HospitalList Component CTor called');
        this.onHospitalsLoading = new EventEmitter<boolean>();
        this.onHospitalLoading = new EventEmitter<IHospital>();
        this.onHospitalLoaded = new EventEmitter<IHospital>();
    }

    visibleCount = (): Number => {
        return 0;
    }

    private hospitalLoading(hospital: IHospital) {
        this.onHospitalLoading.emit(hospital);
    }

    private hospitalLoaded(hospital: IHospital) {
        this.onHospitalLoaded.emit(hospital);
    }
}
