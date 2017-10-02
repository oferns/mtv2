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
import 'rxjs/add/operator/toArray';

@Component({
    selector: 'app-hospital-list',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalListComponent {

    loading: boolean;
    _data: Array<IHospital>;

    _loaded: Array<number> = new Array<number>();
    _progress: number;

    get total(): number {
        return this._data ? this._data.length : 0
    }

    get unregistered(): number {
        return this._data ? this._data.filter(h => !h.representative && !h.newTarget && !h.strokeCenter).length : 0;
    }

    get unregisteredInView(): number {
        return this._data ?
            this._data.filter(h => !h.representative && !h.newTarget && !h.strokeCenter && h.inView && h.visible).length : 0;
    }

    get visible(): number {
        return this._data ? this._data.filter(h => h.inView && h.visible).length : 0;
    }

    get strokeCenters(): number {
        return this._data ? this._data.filter(h => h.strokeCenter).length : 0;
    }

    get strokeCentersInView(): number {
        return this._data ? this._data.filter(h => h.strokeCenter && h.inView && h.visible).length : 0;
    }

    get newTargets(): number {
        return this._data ? this._data.filter(h => h.newTarget).length : 0;
    }

    get newTargetsInView(): number {
        return this._data ? this._data.filter(h => h.newTarget && h.inView && h.visible).length : 0;
    }

    get registered(): number {
        return this._data ? this._data.filter((h: IHospital) => h.representative).length : 0;
    }

    get registeredInView(): number {
        const hs = this._data ? this._data.filter((h: IHospital) => {
            return h.representative && h.inView && h.visible;
        }) : [];
        return hs.length;
    }

    get registeredStrokeCenters(): number {
        return this._data ? this._data.filter((h: IHospital) => h.representative && h.strokeCenter).length : 0;
    }

    get registeredStrokeCentersInView(): number {
        return this._data ? this._data.filter((h: IHospital) => h.representative && h.strokeCenter && h.inView && h.visible).length : 0;
    }

    @Input()
    hospitals: Observable<IHospital[]>;

    @Input()
    set country(country: ICountry) {
        if (country && country.id > 0) {
            this.isLoading.emit(this.loading = true);
            this.hospitals = this.hcoService.getHospitals(country).do(hospitals => {
                this.isLoading.emit(this.loading = false);
                this._data = hospitals;
            });
        }
    }

    @Output() isLoading: EventEmitter<boolean>;
    @Output() onToggleRegistered: EventEmitter<boolean>;
    @Output() onToggleStrokeCenters: EventEmitter<boolean>;
    @Output() onToggleNewTargets: EventEmitter<boolean>;
    @Output() onToggleUnregistered: EventEmitter<boolean>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalList Component CTor called');
        this.isLoading = new EventEmitter<boolean>();
        this.onToggleRegistered = new EventEmitter<boolean>();
        this.onToggleStrokeCenters = new EventEmitter<boolean>();
        this.onToggleNewTargets = new EventEmitter<boolean>();
        this.onToggleUnregistered = new EventEmitter<boolean>();
    }

    toggleRegistered = (event: any) => {
        this.onToggleRegistered.emit(event.source.checked);
    }

    toggleStrokeCenters = (event: any) => {
        this.onToggleStrokeCenters.emit(event.source.checked);
    }

    toggleNewTargets = (event: any) => {
        this.onToggleNewTargets.emit(event.source.checked);
    }

    toggleUnregistered = (event: any) => {
        this.onToggleUnregistered.emit(event.source.checked);
    }
}
