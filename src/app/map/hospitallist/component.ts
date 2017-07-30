import {
    Component,
    Input,
    Output,
    EventEmitter,
    QueryList,
    ElementRef,
    ViewChildren
} from '@angular/core';


import { IHospital } from '../../data/ihospital';

@Component({
    selector: 'app-hospital-list',
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
})

export class HospitalListComponent {

    @Input()
    hospitals: Array<IHospital>;

    @Output()
    hospitalChecked: EventEmitter<number> = new EventEmitter();

    @ViewChildren('hospital') private checkBoxes: QueryList<ElementRef>;

    constructor() {

    }

    toggleAll(event: MouseEvent): void {
        const checked = (<HTMLInputElement>event.target).checked;
        this.checkBoxes.forEach((c) => { c.nativeElement.checked = checked })
    }
}
