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

    @Input()
    set country(country: ICountry) {
        if (country && country.id > 0) {
            this.hospitalsLoading.emit(this.isLoading = true);
            this.hcoService.getHospitals(country)
                .do(h => this.log.debug(`HospitalListComponent got ${h.length} hospitals for ${country.name}`))
                .subscribe(hs => {
                    this.hospitalsLoading.emit(this.isLoading = false);
                    this.hospitals = hs;
                });
        } else {
            this.hospitals = new Array<IHospital>();
        }
    };

    @Input()
    hospitals: Array<IHospital>;

    @Output()
    hospitalsLoading: EventEmitter<boolean>;

    @Output()
    hospitalChecked: EventEmitter<IHospital>;

    @Output()
    hospitalClicked: EventEmitter<IHospital>;

    @ViewChildren('checkBox') private checkBoxes: QueryList<ElementRef>;

    constructor(
        @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        log.debug('HospitalList Component CTor called');
        this.hospitals = new Array<IHospital>();
        this.hospitalsLoading = new EventEmitter<boolean>();
        this.hospitalChecked = new EventEmitter<IHospital>();
        this.hospitalClicked = new EventEmitter<IHospital>();
    }

    toggleAll = (event: MouseEvent): void =>
        this.checkBoxes.forEach(c => c.nativeElement.checked = (<HTMLInputElement>event.target).checked);

    visibleCount = (): Number => this.hospitals.filter(f => f.visible).length;

    clicked = (hospital: IHospital) => this.hospitalClicked.emit(hospital);
}
