import {
    Component,
    Input,
    Output,
    EventEmitter,
    QueryList,
    ElementRef,
    ViewChildren,
    Inject,
    OnChanges,
    ChangeDetectorRef
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

export class HospitalListComponent implements OnChanges {

    private loading: boolean;
    private _data: Array<IHospital>;

    private get visible(): Number {
        return this._data ? this._data.filter(h => h.visible).length : 0;
    }

    private get strokeCenters(): Number {
        return this._data ? this._data.filter(h => h.strokeCenter).length : 0;
    }

    private get strokeCentersInView(): Number {
        return this._data ? this._data.filter(h => h.strokeCenter && h.visible).length : 0;
    }

    private get registered(): Number {
        return this._data ? this._data.filter((h: IHospital) => h.representative).length : 0;
    }

    private get registeredInView(): Number {
        return this._data ? this._data.filter((h: IHospital) => h.representative && h.visible).length : 0;
    }

    private get registeredStrokeCenters(): Number {
        return this._data ? this._data.filter((h: IHospital) => h.representative && h.strokeCenter).length : 0;
    }

    private get registeredStrokeCentersInView(): Number {
        return this._data ? this._data.filter((h: IHospital) => h.representative && h.strokeCenter && h.visible).length : 0;
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

    @Output()
    isLoading: EventEmitter<boolean>;


    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalList Component CTor called');
        this.isLoading = new EventEmitter<boolean>();
    }

    ngOnChanges(changes: any): void {
        this.log.info('HospitalList Component ngOnChanges called');
    }
}
