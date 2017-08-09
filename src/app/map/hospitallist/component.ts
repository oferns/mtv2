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
    hospitals: Array<IHospital> = new Array<IHospital>();

    @Input()
    set view(view: any) {
        console.log("View");
        this.hospitals.forEach(h => {
        })
    }

    @Output()
    hospitalChecked: EventEmitter<IHospital> = new EventEmitter();

    @ViewChildren('listItem') private listItems: QueryList<ElementRef> = new QueryList<ElementRef>();
    @ViewChildren('checkBox') private checkBoxes: QueryList<ElementRef> = new QueryList<ElementRef>();

    constructor() { }

    toggleAll(event: MouseEvent): void {
        const checked = (<HTMLInputElement>event.target).checked;
        this.checkBoxes.forEach((c) => { c.nativeElement.checked = checked })
    }

}
