import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Employee } from '@curacaru/models/employee.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, combineLatest, mergeMap, startWith, takeUntil, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EmployeeListMobileComponent } from '../employee-list-mobile/employee-list-mobile.component';
import { EmployeeListTableComponent } from '../employee-list-table/employee-list-table.component';
import { ApiService, ErrorHandlerService, LoaderService, ScreenService } from '@curacaru/services';
import { Page } from '@curacaru/models/page.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';
import { ChangePageAction, EmployeeListState } from '@curacaru/state/employee-list.state';
import { Store } from '@ngrx/store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, EmployeeListMobileComponent, EmployeeListTableComponent, FontAwesomeModule, PagingComponent],
  selector: 'cura-employee-list',
  standalone: true,
  templateUrl: './employee-list.component.html',
})
export class EmployeeListComponent implements OnDestroy, OnInit {
  private readonly apiService = inject(ApiService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly loaderService = inject(LoaderService);
  private readonly modalService = inject(NgbModal);
  private readonly screenService = inject(ScreenService);
  private readonly toastrService = inject(ToastrService);
  private readonly store = inject(Store<EmployeeListState>);

  isMobile = this.screenService.isMobile;
  isLoading = signal(true);
  employees = signal<Employee[]>([]);
  page = signal<Page<Employee> | null>(null);

  $refresh = new Subject<void>();
  $onDestroy = new Subject<void>();

  ngOnInit() {
    this.subscribeEmployeeList();
  }

  ngOnDestroy() {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }

  onDelete(employee: Employee) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteEmployee(employee));
    modalRef.componentInstance.title = 'Mitarbeiter löschen';
    modalRef.componentInstance.text = `Soll ${employee.firstName} ${employee.lastName} wirklich gelöscht werden?`;
  }

  onPageChange($event: number) {
    this.store.dispatch(ChangePageAction({ page: $event }));
  }

  private subscribeEmployeeList() {
    combineLatest({ state: this.store, refresh: this.$refresh.pipe(startWith({})) })
      .pipe(
        takeUntil(this.$onDestroy),
        tap(() => {
          this.employees.set([]);
          this.isLoading.set(true);
        }),
        mergeMap((o) => this.apiService.getEmployeeList(o.state.employeeList.page))
      )
      .subscribe({
        next: (result) => {
          this.employees.set(result.items);
          this.page.set(result);
          this.isLoading.set(false);
        },
        error: (e) => {
          this.errorHandlerService.handleError(e);
          this.isLoading.set(false);
        },
      });
  }

  private deleteEmployee(employee: Employee) {
    this.loaderService.show();
    this.apiService.deleteEmployee(employee.id).subscribe({
      complete: () => {
        this.toastrService.success(`${employee.firstName} ${employee.lastName} wurde gelöscht.`);
        this.loaderService.hide();
        this.$refresh.next();
      },
      error: (e) => {
        this.errorHandlerService.handleError(e);
        this.loaderService.hide();
      },
    });
  }
}
