import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Employee } from '../../models/employee.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '../../modals/confirm-modal/confirm-modal.component';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';
import { UUID } from 'angular2-uuid';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  selector: 'cura-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnDestroy, OnInit {
  public faGear = faGear;
  public faTrashCan = faTrashCan;
  public employees: Employee[] = [];

  private httpSubscription: Subscription | undefined = undefined;

  constructor(private httpClient: HttpClient, private modalService: NgbModal, private toastr: ToastrService) {}

  ngOnDestroy(): void {
    this.httpSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.httpClient
      .get<Employee[]>('https://localhost:7077/employee/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.employees = result;
        },
        error: (error) => {
          this.toastr.error('Mitarbeiterliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  public handleDelete(employee: Employee) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteEmployee(employee);
    });
    modalRef.componentInstance.title = 'Mitarbeiter löschen';
    modalRef.componentInstance.text = `Soll ${employee.firstName} ${employee.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(employee: Employee) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient.delete(`https://localhost:7077/employee/${employee.id}`).subscribe({
      complete: () => {
        this.toastr.success(`${employee.firstName} ${employee.lastName} wurde gelöscht.`);
        this.employees = this.employees.filter((e) => e.id !== employee.id);
      },
      error: (error) => {
        this.toastr.error('Mitarbeiter konnte nicht gelöscht werden: ' + error.message);
      },
    });
  }
}
