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
import { HospitalComponent } from '../hospital/component';
import { IHcoService } from '../../services/ihco.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/count';

@Component({
    selector: 'app-hospital-list',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalListComponent {

    private isLoading: boolean;
    private _country: ICountry;

    @Input()
    hospitals: Observable<IHospital>;

    get country() {
        return this._country;
    }

    @Input()
    set country(country: ICountry) {
        if (country && country.id > 0) {
            this._country = country;
            this.onHospitalsLoading.emit(this.isLoading = true);
            this.hospitals = this.hcoService.getHospitals(country);
            this.hospitals.subscribe((hs: any) => {
                this.log.info(`HospitalListComponent got ${hs.length} hospitals for ${country.name}`);
                this.log.info('HospitalListComponent emitting onHospitalsLoading (false)');
                hs.forEach((h: IHospital) => {
                    if ((!h.lat || h.lng) || (h.lat === 0 && h.lng === 0)) {
                        h.visible = false;
                    }
                    h.visible = this._mapBounds.contains({ lat: Number(h.lat), lng: Number(h.lng) });
                })
                this.onHospitalsLoading.emit(this.isLoading = false);

            });
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


    @Output()
    onHospitalsLoading: EventEmitter<boolean>;

    @Output()
    onHospitalLoading: EventEmitter<IHospital>;

    @Output()
    onHospitalLoaded: EventEmitter<IHospital>;

    private _mapBounds: any;

    @Input()
    set mapBounds(bounds: any) {
        this._mapBounds = bounds;
        if (this.hospitals) {

            this.hospitals = this.hospitals.map((h: IHospital) => {
                if ((!h.lat || !h.lng) || (h.lat === 0 && h.lng === 0)) {
                    h.visible = false;
                } else {
                    h.visible = bounds.contains({ lat: Number(h.lat), lng: Number(h.lng) })
                }
                return h;
            });

        }
    };

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
        return 0;
    }

    private hospitalLoading(hospital: IHospital) {
        this.onHospitalLoading.emit(hospital);
    }

    private hospitalLoaded(hospital: IHospital) {
        this.onHospitalLoaded.emit(hospital);
    }
}
