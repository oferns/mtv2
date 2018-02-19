import {
    Component,
    Input,
    Output,
    EventEmitter,
    Inject
} from '@angular/core';

import { Logger } from 'angular2-logger/core';

import { IHospital } from '../../data/ihospital';
import { MatButtonToggleChange } from '@angular/material';
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
    @Output() onToggleTreatingNoAngels: EventEmitter<boolean>;
    @Output() onToggleFutureTarget: EventEmitter<boolean>;

    constructor( @Inject('IHcoService') private readonly hcoService: IHcoService,
        private readonly log: Logger
    ) {
        this.log.info('HospitalInfoComponent Ctor called');
        this.onToggleRoute = new EventEmitter<boolean>();
        this.onToggleTreatingNoAngels = new EventEmitter<boolean>();
        this.onToggleFutureTarget = new EventEmitter<boolean>();
    }

    toggleRoutes(event: MatButtonToggleChange) {
        this.onToggleRoute.emit(event.source.checked);
    }

    toggleTreatingNoAngels(event: MatButtonToggleChange) {
        this.onToggleTreatingNoAngels.emit(event.source.checked);
        this.hospital.treatingNoAngels = event.source.checked;
        this.hcoService.toggleTreatingNoAngels(this.hospital).subscribe(h => this.hospital = h);
    }

    toggleFutureTarget(event: MatButtonToggleChange) {
        this.onToggleFutureTarget.emit(event.source.checked);
        this.hospital.futureTarget = event.source.checked;
        this.hcoService.toggleFutureTarget(this.hospital).subscribe(h => this.hospital = h);
    }
}
