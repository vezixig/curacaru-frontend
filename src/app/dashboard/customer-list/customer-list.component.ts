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
import { CustomerListEntry } from '../../models/customer-list-entry.model';

@Component({
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnDestroy, OnInit {
  public faGear = faGear;
  public faTrashCan = faTrashCan;
  public customers: CustomerListEntry[] = [];

  private httpSubscription: Subscription | undefined = undefined;

  constructor(private httpClient: HttpClient, private modalService: NgbModal, private toastr: ToastrService) {}

  ngOnDestroy(): void {
    this.httpSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.httpClient
      .get<CustomerListEntry[]>('https://localhost:7077/customer/list')
      .pipe(first())
      .subscribe({
        next: (result) => {
          this.customers = result;
        },
        error: (error) => {
          this.toastr.error('Kundenliste konnte nicht abgerufen werden: ' + error.message);
        },
      });
  }

  public handleDelete(customer: CustomerListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => {
      this.deleteEmployee(customer);
    });
    modalRef.componentInstance.title = 'Kunden löschen';
    modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(customer: CustomerListEntry) {
    this.httpSubscription?.unsubscribe();

    this.httpSubscription = this.httpClient.delete(`https://localhost:7077/customer/${customer.id}`).subscribe({
      complete: () => {
        this.toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
        this.customers = this.customers.filter((e) => e.id !== customer.id);
      },
      error: (error) => {
        this.toastr.error('Mitarbeiter konnte nicht gelöscht werden: ' + error.message);
      },
    });
  }
}
