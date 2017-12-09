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
    @Output() onToggleStrokeReady: EventEmitter<boolean>;
    @Output() onToggleTreatingNoAngels: EventEmitter<boolean>;
    @Output() onToggleConsulting: EventEmitter<boolean>;
    

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalInfoComponent Ctor called');
        this.onToggleRoute = new EventEmitter<boolean>();
        this.onToggleStrokeReady = new EventEmitter<boolean>();
        this.onToggleTreatingNoAngels = new EventEmitter<boolean>();
        this.onToggleConsulting = new EventEmitter<boolean>();
    }

    toggleRoutes(event: MdButtonToggleChange) {
        this.onToggleRoute.emit(event.source.checked);
    }

    toggleStrokeReady(event: MdButtonToggleChange) {
        this.onToggleStrokeReady.emit(event.source.checked);
        this.hospital.strokeReady = event.source.checked;
        this.hcoService.toggleStrokeReady(this.hospital).subscribe(h => this.hospital = h);

    }
    toggleTreatingNoAngels(event: MdButtonToggleChange) {
        this.onToggleTreatingNoAngels.emit(event.source.checked);
        this.hospital.treatingNoAngels = event.source.checked;
        this.hcoService.toggleTreatingNoAngels(this.hospital).subscribe(h => this.hospital = h);
    }
    toggleConsulting(event: MdButtonToggleChange) {
        this.onToggleConsulting.emit(event.source.checked);
        this.hospital.consulting = event.source.checked;
        this.hcoService.toggleConsulting(this.hospital).subscribe(h => this.hospital = h);
    }


}

