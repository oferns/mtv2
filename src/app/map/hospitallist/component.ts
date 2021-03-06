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
import 'rxjs/add/observable/from'

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
        return this._data ? this._data.filter(h => !h.registered).length : 0;
    }

    get unregisteredInView(): number {
        return this._data ?
            this._data.filter(h => !h.registered && h.inView && h.visible).length : 0;
    }

    get visible(): number {
        return this._data ? this._data.filter(h => h.inView && h.visible).length : 0;
    }

    get treatingNoAngelss(): number {
        return this._data ? this._data.filter(h => !h.registered && h.treatingNoAngels).length : 0;
    }

    get treatingNoAngelssInView(): number {
        return this._data ? this._data.filter(h => !h.registered && h.treatingNoAngels && h.inView && h.visible).length : 0;
    }

    get futureTargets(): number {
        return this._data ? this._data.filter(h => !h.registered && h.futureTarget).length : 0;
    }

    get futureTargetsInView(): number {
        return this._data ? this._data.filter(h => !h.registered && h.futureTarget && h.inView && h.visible).length : 0;
    }

    get registered(): number {
        return this._data ? this._data.filter((h: IHospital) => h.registered).length : 0;
    }

    get registeredInView(): number {
        const hs = this._data ? this._data.filter((h: IHospital) => {
            return h.registered && h.inView && h.visible;
        }) : [];
        return hs.length;
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
    @Output() onToggleTreatingNoAngelss: EventEmitter<boolean>;
    @Output() onToggleUnregistered: EventEmitter<boolean>;
    @Output() onFilterChanged: EventEmitter<string>;
    @Output() onHospitalMouseEnter: EventEmitter<IHospital>;
    @Output() onHospitalMouseLeave: EventEmitter<IHospital>;
    @Output() onToggleFutureTargets: EventEmitter<boolean>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalList Component CTor called');
        this.isLoading = new EventEmitter<boolean>();
        this.onToggleRegistered = new EventEmitter<boolean>();
        this.onToggleTreatingNoAngelss = new EventEmitter<boolean>();
        this.onToggleFutureTargets = new EventEmitter<boolean>();
        this.onToggleUnregistered = new EventEmitter<boolean>();
        this.onFilterChanged = new EventEmitter<string>();
        this.onHospitalMouseEnter = new EventEmitter<IHospital>();
        this.onHospitalMouseLeave = new EventEmitter<IHospital>();
    }

    filterHcos = (event: any) => {
        this.onFilterChanged.emit(event.target.value);
    }

    hospitalMouseEnter = (event: IHospital) => {
        this.onHospitalMouseEnter.emit(event);
    }

    hospitalMouseLeave = (event: IHospital) => {
        this.onHospitalMouseLeave.emit(event);
    }

    toggleRegistered = (event: any) => {
        this.onToggleRegistered.emit(event.source.checked);
    }

    toggleTreatingNoAngelss = (event: any) => {
        this.onToggleTreatingNoAngelss.emit(event.source.checked);
    }

    toggleFutureTargets = (event: any) => {
        this.onToggleFutureTargets.emit(event.source.checked);
    }

    toggleUnregistered = (event: any) => {
        this.onToggleUnregistered.emit(event.source.checked);
    }
}
