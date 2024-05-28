import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, firstValueFrom, map, mergeMap, startWith, takeUntil, tap } from 'rxjs';
import { CustomerListEntry } from '@curacaru/models/customer-list-entry.model';
import { EmployeeBasic, UserEmployee } from '@curacaru/models';
import { FormsModule } from '@angular/forms';
import { ApiService, ErrorHandlerService, LocationService, ScreenService, UserService } from '@curacaru/services';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { ChangeEmployeeFilterAction, ChangePageAction } from '@curacaru/state/customer-list.state';
import { UUID } from 'angular2-uuid';
import { AppointmentListActions, AppointmentListState } from '@curacaru/state/appointment-list.state';
import { DeploymentReportChangeCustomerAction, DeploymentReportListState } from '@curacaru/state/deployment-report-list.state';
import { InvoiceChangeCustomerAction, InvoicesListState } from '@curacaru/state/invoices-list.state';
import { LoaderFilterComponent } from '@curacaru/shared/loader-filter/loader-filter.component';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';
import { Page } from '@curacaru/models/page.model';
import { DeleteCustomerModal } from '../delete-customer-modal/delete-customer-modal.component';
import { DeleteCustomerModalModel } from '../delete-customer-modal/delete-customer-model.model';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
import { CustomerListEntryComponent } from '../customer-list-entry/customer-list-entry.component';

@Component({
  providers: [ApiService],
  selector: 'cura-customer-list',
  standalone: true,
  templateUrl: './customer-list.component.html',
  imports: [FontAwesomeModule, RouterModule, FormsModule, AsyncPipe, PagingComponent, LoaderFilterComponent, CustomerListEntryComponent],
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
  page = signal<Page<CustomerListEntry> | undefined>(undefined);
  filterModel$ = new Observable<{ employees: EmployeeBasic[] }>();
  isLoading = signal(true);
  selectedEmployeeId = signal<UUID | undefined>(undefined);
  showInactiveCustomers = signal<boolean>(false);

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
    }).pipe(
      map((o) => {
        return { employees: o.employees };
      })
    );

    combineLatest({
      refresh: this.$onRefresh.pipe(startWith({})),
      state: this.store,
    })
      .pipe(
        takeUntil(this.$onDestroy),
        tap(() => {
          this.customers.set([]);
          this.isLoading.set(true);
        }),
        mergeMap((o) => {
          this.showInactiveCustomers.set(o.state.customerList.showInactiveCustomers);
          return this.apiService.getCustomerList(
            o.state.customerList.page,
            o.state.customerList.showInactiveCustomers ? CustomerStatus.Former : CustomerStatus.Customer,
            o.state.customerList.employeeId
          );
        })
      )
      .subscribe({
        next: (o) => {
          this.customers.set(o.items);
          this.page.set(o);
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

  onFilterChanged() {
    this.store.dispatch(
      ChangeEmployeeFilterAction({
        employeeId: this.selectedEmployeeId() == '' ? undefined : this.selectedEmployeeId(),
        showInactiveCustomers: this.showInactiveCustomers(),
      })
    );
  }

  handleDelete(customer: CustomerListEntry) {
    const modalRef = this.modalService.open(DeleteCustomerModal);
    modalRef.result.then((result: DeleteCustomerModalModel) => this.deleteCustomer(result, customer));
    modalRef.componentInstance.customerName = `${customer.firstName} ${customer.lastName}`;
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

  onPageChange($event: number) {
    this.store.dispatch(ChangePageAction({ page: $event }));
  }

  private deleteCustomer(model: DeleteCustomerModalModel, customer: CustomerListEntry) {
    this.apiService
      .deleteCustomer(customer.id, model.deleteOpenAppointments, model.deleteBudgets)
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
