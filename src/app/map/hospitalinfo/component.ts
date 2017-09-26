import {
    Component,
    Input,
    Output,
    EventEmitter,
    Inject
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IHospital } from '../../data/ihospital';
import { MdButtonToggleChange } from '@angular/material';
import { IHcoService } from 'app/services/ihco.service';

@Component({
    selector: 'app-hospital-info',
    templateUrl: './component.html',
    styleUrls: ['./component.scss']
})

export class HospitalInfoComponent {

    @Input() hospital: IHospital;
    @Input() on: boolean;

    @Output() onToggleRoute: EventEmitter<boolean>;
    @Output() onToggleStrokeCenter: EventEmitter<boolean>;
    @Output() onToggleNewTarget: EventEmitter<boolean>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalInfoComponent Ctor called');
        this.onToggleRoute = new EventEmitter<boolean>();
        this.onToggleStrokeCenter = new EventEmitter<boolean>();
        this.onToggleNewTarget = new EventEmitter<boolean>();
    }

    toggleRoutes(event: MdButtonToggleChange) {
        this.onToggleRoute.emit(event.source.checked);
    }

    toggleStrokeCenter(event: MdButtonToggleChange) {
        this.onToggleStrokeCenter.emit(event.source.checked);
        this.hospital.strokeCenter = event.source.checked;
        this.hcoService.toggleStrokeCenter(this.hospital).subscribe(h => this.hospital = h);

    }
    toggleNewTarget(event: MdButtonToggleChange) {
        this.onToggleNewTarget.emit(event.source.checked);
        this.hospital.newTarget = event.source.checked;
        this.hcoService.toggleNewTarget(this.hospital).subscribe(h => this.hospital = h);
    }
}

