import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Subscription, first } from 'rxjs';
import { NgbdModalConfirm } from '../../modals/confirm-modal/confirm-modal.component';
import { CustomerListEntry } from '../../models/customer-list-entry.model';
import { ApiService } from '../../services/api.service';
import { UserService } from '../../services/user.service';
import { UserEmployee } from '../../models/user-employee.model';

@Component({
  imports: [CommonModule, FontAwesomeModule, NgxSkeletonLoaderModule, RouterModule],
  providers: [ApiService],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnDestroy, OnInit {
  customers: CustomerListEntry[] = [];
  faGear = faGear;
  faTrashCan = faTrashCan;
  isManager: boolean = false;
  isLoading: boolean = true;

  private deleteEmployeeSubscription?: Subscription;
  private getCustomerListSubscription?: Subscription;

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService, private userService: UserService) {}

  ngOnDestroy(): void {
    this.deleteEmployeeSubscription?.unsubscribe();
    this.getCustomerListSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.isManager = this.userService.user?.isManager ?? false;
    this.getCustomerListSubscription = this.apiService.getCustomerList().subscribe({
      next: (result) => {
        this.customers = result;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastr.error(`Kundenliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
        this.isLoading = false;
      },
    });
  }

  handleDelete(customer: CustomerListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteEmployee(customer));
    modalRef.componentInstance.title = 'Kunden löschen';
    modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(customer: CustomerListEntry) {
    this.deleteEmployeeSubscription?.unsubscribe();
    this.deleteEmployeeSubscription = this.apiService.deleteCustomer(customer.id).subscribe({
      complete: () => {
        this.toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
        this.customers = this.customers.filter((e) => e.id !== customer.id);
      },
      error: (error) => this.toastr.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    });
  }
}
