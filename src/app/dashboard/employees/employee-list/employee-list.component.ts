import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Employee } from '@curacaru/models/employee.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { RouterModule } from '@angular/router';
import { Subject, mergeMap, startWith, takeUntil, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { EmployeeListMobileComponent } from '../employee-list-mobile/employee-list-mobile.component';
import { EmployeeListTableComponent } from '../employee-list-table/employee-list-table.component';
import { ApiService, ErrorHandlerService, LoaderService, ScreenService } from '@curacaru/services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, EmployeeListMobileComponent, EmployeeListTableComponent],
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

  isMobile = this.screenService.isMobile;
  isLoading = signal(true);
  employees = signal<Employee[]>([]);

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

  private subscribeEmployeeList() {
    this.$refresh
      .pipe(
        takeUntil(this.$onDestroy),
        startWith({}),
        tap(() => {
          this.employees.set([]);
          this.isLoading.set(true);
        }),
        mergeMap(() => this.apiService.getEmployeeList())
      )
      .subscribe({
        next: (result) => {
          this.employees.set(result);
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
