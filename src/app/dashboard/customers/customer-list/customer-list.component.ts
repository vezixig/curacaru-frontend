import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  Observable,
  Subject,
  combineLatest,
  delay,
  filter,
  finalize,
  firstValueFrom,
  last,
  map,
  mergeMap,
  share,
  shareReplay,
  skipUntil,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { CustomerListEntry } from '@curacaru/models/customer-list-entry.model';
import { EmployeeBasic, UserEmployee } from '@curacaru/models';
import { FormsModule } from '@angular/forms';
import { ApiService, ErrorHandlerService, LocationService, ScreenService, UserService } from '@curacaru/services';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ChangeEmployeeFilterAction } from '@curacaru/state/customer-list.state';
import { UUID } from 'angular2-uuid';
import { AppointmentListActions, AppointmentListState } from '@curacaru/state/appointment-list.state';
import { DeploymentReportChangeCustomerAction, DeploymentReportListState } from '@curacaru/state/deployment-report-list.state';
import { InvoiceChangeCustomerAction, InvoicesListState } from '@curacaru/state/invoices-list.state';
import { LoaderFilterComponent } from '@curacaru/shared/loader-filter/loader-filter.component';
import { CustomerListeTableComponent } from '../customer-list-table/customer-list-table.component';
import { CustomerListMobileComponent } from '../customer-list-mobile/customer-list-mobile.component';

@Component({
  providers: [ApiService],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
  imports: [FontAwesomeModule, RouterModule, FormsModule, AsyncPipe, LoaderFilterComponent, CustomerListeTableComponent, CustomerListMobileComponent],
})
export class CustomerListComponent implements OnDestroy, OnInit {
  private readonly apiService = inject(ApiService);
  private readonly appointmentListStore = inject(Store<AppointmentListState>);
  private readonly deploymentReportListStore = inject(Store<DeploymentReportListState>);
  private readonly invoiceListStore = inject(Store<InvoicesListState>);
  private readonly locationService = inject(LocationService);
  private readonly modalService = inject(NgbModal);
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly toastr = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly screenService = inject(ScreenService);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  user?: UserEmployee;
  isMobile = this.screenService.isMobile;

  customers = signal<CustomerListEntry[]>([]);
  filterModel$ = new Observable<{ employees: EmployeeBasic[] }>();
  isLoading = signal(true);
  selectedEmployeeId = signal<UUID | undefined>(undefined);

  private $onRefresh = new Subject<void>();
  private $onDestroy = new Subject<void>();

  ngOnDestroy(): void {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }

  async ngOnInit() {
    this.user = await firstValueFrom(this.userService.user$);

    this.filterModel$ = combineLatest({
      employees: this.apiService.getEmployeeBaseList(),
      state: this.store,
    }).pipe(
      tap((o) => (o.state.customerList.employeeId != '' ? this.selectedEmployeeId.set(o.state.customerList.employeeId) : '')),
      map((o) => {
        this.$onRefresh.next();
        return { employees: o.employees };
      })
    );

    const customerRequest = this.$onRefresh.pipe(mergeMap(() => this.apiService.getCustomerList()));

    combineLatest({
      customers: customerRequest,
      state: this.store,
    })
      .pipe(
        tap(() => console.log('refresh')),
        takeUntil(this.$onDestroy),
        tap(() => {
          this.customers.set([]);
          this.isLoading.set(true);
        }),
        map((result) => ({
          customers: result.customers.filter(
            (o) => !result.state.customerList.employeeId || o.associatedEmployeeId == result.state.customerList.employeeId
          ),
        }))
      )
      .subscribe({
        next: (o) => {
          this.customers.set(o.customers);
          this.isLoading.set(false);
        },
        error: (e) => {
          this.errorHandlerService.handleError(e);
          this.isLoading.set(false);
        },
      });
  }

  handleNavigate(customer: CustomerListEntry) {
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

  handleShowAppointments(customer: CustomerListEntry) {
    this.appointmentListStore.dispatch(AppointmentListActions.changeCustomerFilter({ customerId: customer.id }));
    this.router.navigate(['/dashboard/appointments']);
  }

  handleShowDeploymentReports(customer: CustomerListEntry) {
    this.deploymentReportListStore.dispatch(DeploymentReportChangeCustomerAction({ customerId: customer.id }));
    this.router.navigate(['/dashboard/documents/deployment-reports']);
  }

  handleShowInvoices(customer: CustomerListEntry) {
    this.invoiceListStore.dispatch(InvoiceChangeCustomerAction({ customerId: customer.id }));
    this.router.navigate(['/dashboard/invoices']);
  }

  private deleteEmployee(customer: CustomerListEntry) {
    this.apiService
      .deleteCustomer(customer.id)
      .pipe(takeUntil(this.$onDestroy))
      .subscribe({
        next: () => {
          this.toastr.success(`${customer.firstName} ${customer.lastName} wurde gelöscht.`);
          this.$onRefresh.next();
        },
        error: (error) => this.toastr.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
      });
  }
}
