import { ApiService } from '../../../services/api.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Employee } from '../../../models/employee.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { faEllipsis, faGear, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';

@Component({
  imports: [FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule, ReplacePipe],
  providers: [ApiService],
  selector: 'cura-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnDestroy, OnInit {
  faGear = faGear;
  faPhone = faPhone;
  faEnvelope = faEnvelope;
  faTrashCan = faTrashCan;
  faEllipsis = faEllipsis;
  faUser = faUser;
  isLoading: boolean = true;
  employees: Employee[] = [];

  private deleteEmployeeSubscription?: Subscription;
  private getEmployeeListSubscription?: Subscription;

  private readonly apiService = inject(ApiService);
  private readonly modalService = inject(NgbModal);
  private readonly toastrService = inject(ToastrService);

  ngOnDestroy(): void {
    this.getEmployeeListSubscription?.unsubscribe();
    this.deleteEmployeeSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.getEmployeeListSubscription = this.apiService.getEmployeeList().subscribe({
      next: (result) => {
        this.employees = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastrService.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
        this.isLoading = false;
      },
    });
  }

  handleDelete(employee: Employee) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteEmployee(employee));
    modalRef.componentInstance.title = 'Mitarbeiter löschen';
    modalRef.componentInstance.text = `Soll ${employee.firstName} ${employee.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(employee: Employee) {
    this.deleteEmployeeSubscription?.unsubscribe();

    this.deleteEmployeeSubscription = this.apiService.deleteEmployee(employee.id).subscribe({
      complete: () => {
        this.toastrService.success(`${employee.firstName} ${employee.lastName} wurde gelöscht.`);
        this.employees = this.employees.filter((e) => e.id !== employee.id);
      },
      error: (error) => this.toastrService.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    });
  }
}
