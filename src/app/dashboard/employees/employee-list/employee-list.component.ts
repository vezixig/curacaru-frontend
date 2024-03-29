import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../../models/employee.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEllipsis, faGear, faPhone } from '@fortawesome/free-solid-svg-icons';
import { faEnvelope, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';

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

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService) {}

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
        this.toastr.error(`Mitarbeiterliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
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
        this.toastr.success(`${employee.firstName} ${employee.lastName} wurde gelöscht.`);
        this.employees = this.employees.filter((e) => e.id !== employee.id);
      },
      error: (error) => this.toastr.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    });
  }
}
