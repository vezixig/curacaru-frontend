import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faGear, faHouse, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, takeUntil } from 'rxjs';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { CustomerListEntry } from '@curacaru/models/customer-list-entry.model';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { EmployeeBasic } from '@curacaru/models';
import { FormsModule } from '@angular/forms';
import { ApiService, LocationService, UserService } from '@curacaru/services';

@Component({
  imports: [FontAwesomeModule, NgxSkeletonLoaderModule, ReplacePipe, RouterModule, FormsModule],
  providers: [ApiService],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnDestroy, OnInit {
  faGear = faGear;
  faHouse = faHouse;
  faLocationDot = faLocationDot;
  faPhone = faPhone;
  faTrashCan = faTrashCan;
  faUser = faUser;
  faCircleInfo = faCircleInfo;

  filteredCustomers: CustomerListEntry[] = [];
  employees: EmployeeBasic[] = [];
  selectedEmployeeId?: number = undefined;
  isManager: boolean = false;
  isLoading: boolean = true;

  private $onDestroy = new Subject();
  private customers: CustomerListEntry[] = [];

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService, private userService: UserService, private locationService: LocationService) {}

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.isManager = this.userService.user?.isManager ?? false;

    forkJoin({
      customers: this.apiService.getCustomerList(),
      employees: this.apiService.getEmployeeBaseList(),
    })
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: (result) => {
          this.employees = result.employees;
          this.customers = result.customers;
        },
        complete: () => {
          this.filterCustomers();
          this.isLoading = false;
        },
        error: (error) => this.toastr.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`),
      });
  }

  onCustomerAddressClick = (customer: CustomerListEntry) => this.locationService.openLocationLink(`${customer.street} ${customer.zipCode} ${customer.city}`);

  onSelectionChanged = () => this.filterCustomers();

  private filterCustomers() {
    if (this.selectedEmployeeId) {
      this.filteredCustomers = this.customers.filter((e) => e.associatedEmployeeId === this.selectedEmployeeId);
    } else {
      this.filteredCustomers = this.customers;
    }
  }

  handleDelete(customer: CustomerListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteEmployee(customer));
    modalRef.componentInstance.title = 'Kunden löschen';
    modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden?`;
  }

  private deleteEmployee(customer: CustomerListEntry) {
    this.apiService
      .deleteCustomer(customer.id)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        complete: () => {
          this.toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
          this.customers = this.customers.filter((e) => e.id !== customer.id);
        },
        error: (error) => this.toastr.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
      });
  }
}
