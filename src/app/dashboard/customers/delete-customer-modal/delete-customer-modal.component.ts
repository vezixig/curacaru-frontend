import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  imports: [FormsModule],
  selector: 'cura-delete-customer-model',
  standalone: true,
  templateUrl: './delete-customer-modal.component.html',
})
export class DeleteCustomerModal {
  @Input() customerName = '';
  deleteOpenAppointments = signal<boolean>(true);

  modal = inject(NgbActiveModal);
}
