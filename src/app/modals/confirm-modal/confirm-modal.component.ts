import { Component, Input, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'ngbd-modal-confirm',
  standalone: true,
  templateUrl: './confirm-modal.component.html',
})
export class NgbdModalConfirm {
  @Input() title: string = 'Bist du dir sicher?';
  @Input() text: string = 'Soll die Aktion wirklich durchgeführt werden?';

  modal = inject(NgbActiveModal);
}
