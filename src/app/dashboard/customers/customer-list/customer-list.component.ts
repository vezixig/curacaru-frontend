import { Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faGear, faHouse, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, map, takeUntil, tap } from 'rxjs';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { CustomerListEntry } from '@curacaru/models/customer-list-entry.model';
import { ReplacePipe } from '@curacaru/pipes/replace.pipe';
import { EmployeeBasic, UserEmployee } from '@curacaru/models';
import { FormsModule } from '@angular/forms';
import { ApiService, LocationService, UserService } from '@curacaru/services';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ChangeEmployeeFilterAction } from '@curacaru/state/customer-list.state';
import { UUID } from 'angular2-uuid';

@Component({
  imports: [FontAwesomeModule, NgxSkeletonLoaderModule, ReplacePipe, RouterModule, FormsModule, AsyncPipe],
  providers: [ApiService],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent implements OnDestroy {
  faGear = faGear;
  faHouse = faHouse;
  faLocationDot = faLocationDot;
  faPhone = faPhone;
  faTrashCan = faTrashCan;
  faUser = faUser;
  faCircleInfo = faCircleInfo;

  private readonly apiService = inject(ApiService);
  private readonly modalService = inject(NgbModal);
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly locationService = inject(LocationService);
  private readonly store = inject(Store);

  model$ = new Observable<{ customers: CustomerListEntry[]; employees: EmployeeBasic[]; user: UserEmployee }>();
  isLoading = signal(false);
  selectedEmployeeId = signal<UUID | undefined>(undefined);

  private $onDestroy = new Subject();
  private customers: CustomerListEntry[] = [];

  ngOnDestroy(): void {
    this.$onDestroy.next(true);
    this.$onDestroy.complete();
  }

  constructor() {
    this.isLoading.set(true);

    this.model$ = combineLatest({
      customers: this.apiService.getCustomerList(),
      employees: this.apiService.getEmployeeBaseList(),
      state: this.store,
      user: this.userService.user$,
    }).pipe(
      tap((result) => (result.state.customerList.employeeId != '' ? this.selectedEmployeeId.set(result.state.customerList.employeeId) : '')),
      map((result) => ({
        customers: result.customers.filter(
          (o) => !result.state.customerList.employeeId || o.associatedEmployeeId == result.state.customerList.employeeId
        ),
        employees: result.employees,
        user: result.user,
      }))
    );
  }

  onCustomerAddressClick(customer: CustomerListEntry) {
    this.locationService.openLocationLink(`${customer.street} ${customer.zipCode} ${customer.city}`);
  }

  onSelectionChanged() {
    this.store.dispatch(ChangeEmployeeFilterAction({ employeeId: this.selectedEmployeeId() == '' ? undefined : this.selectedEmployeeId() }));
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
