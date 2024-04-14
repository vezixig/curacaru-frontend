import { Injectable, inject } from '@angular/core';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { UUID } from 'angular2-uuid';
import { DateTimeService } from './date-time.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { ApiService } from './api.service';
import { ToastrService } from 'ngx-toastr';
import { AppointmentBase } from '@curacaru/models/appointment-base.model';

@Injectable({
  providedIn: 'root',
})
export class AppointmentService {
  private readonly modalService = inject(NgbModal);
  private readonly apiService = inject(ApiService);
  private readonly toastrService = inject(ToastrService);

  /**
   * Deletes the given appointment after a confirmation dialog.
   * @param appointment The appointment to delete
   * @param $refresh An optional subject to notify about the deletion
   */
  DeleteAppointment(appointment: AppointmentBase, $refresh: Subject<unknown> | undefined) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.onAppointmentDeletionConfirmed(appointment.appointmentId, $refresh);
    });
    modalRef.componentInstance.title = 'Termin löschen';

    const date = DateTimeService.toLocalDateString(appointment.date);
    const start = DateTimeService.toTimeString(appointment.timeStart, false);
    const end = DateTimeService.toTimeString(appointment.timeEnd, false);
    modalRef.componentInstance.text = `Soll der Termin am ${date} von ${start}-${end} wirklich gelöscht werden?`;
  }

  private onAppointmentDeletionConfirmed(appointmentId: UUID, $refresh: Subject<unknown> | undefined) {
    this.apiService.deleteAppointment(appointmentId).subscribe({
      complete: () => {
        this.toastrService.success(`Der Termin wurde gelöscht.`);
        $refresh?.next(true);
      },
      error: (error) => {
        this.toastrService.error(`Termin konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
      },
    });
  }
}
