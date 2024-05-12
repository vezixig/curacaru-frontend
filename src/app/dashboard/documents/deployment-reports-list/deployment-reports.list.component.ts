import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { EmployeeBasic, UserEmployee } from '@curacaru/models';
import { DeploymentReportListEntry } from '@curacaru/models/deployment-report-list.entry.model';
import { MinimalCustomerListEntry } from '@curacaru/models/minimal-customer-list-entry.model';
import { Page } from '@curacaru/models/page.model';
import { ClearanceTypeNamePipe } from '@curacaru/pipes/clarance-type-name.pipe';
import { InsuranceStatusPipe } from '@curacaru/pipes/insurance-status.pipe';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { DateTimeService, UserService } from '@curacaru/services';
import { ApiService } from '@curacaru/services/api.service';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';
import { DeploymentReportChangeFilterAction, DeploymentReportChangePageAction } from '@curacaru/state/deployment-report-list.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faCoins, faDownload, faGear, faPersonCane, faUserAlt } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, catchError, combineLatest, debounceTime, forkJoin, map, startWith, switchMap } from 'rxjs';

@Component({
  imports: [
    ClearanceTypeNamePipe,
    CommonModule,
    FontAwesomeModule,
    FormsModule,
    InsuranceStatusPipe,
    MonthNamePipe,
    NgxSkeletonLoaderModule,
    PagingComponent,
    ReactiveFormsModule,
    RouterModule,
  ],
  providers: [ApiService, MonthNamePipe, ClearanceTypeNamePipe],
  selector: 'cura-deployment',
  standalone: true,
  templateUrl: './deployment-reports-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeploymentReportsListComponent {
  private readonly apiService = inject(ApiService);
  private readonly clearanceTypeNamePipe = inject(ClearanceTypeNamePipe);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly monthNamePipe = inject(MonthNamePipe);
  private readonly store = inject(Store);
  private readonly toastrService = inject(ToastrService);
  private readonly userService = inject(UserService);

  faCalendar = faCalendar;
  faCircleInfo = faCircleInfo;
  faCoins = faCoins;
  faDownload = faDownload;
  faGear = faGear;
  faPersonCane = faPersonCane;
  faTrashCan = faTrashCan;
  faUser = faUser;
  faUserAlt = faUserAlt;
  months = DateTimeService.months;

  readonly filterModel$: Observable<{
    customers: MinimalCustomerListEntry[];
    employees: EmployeeBasic[];
    user: UserEmployee;
  }>;
  readonly filterForm: FormGroup;
  readonly listModel$: Observable<Page<DeploymentReportListEntry>>;
  readonly $onRefresh = new Subject();
  readonly isLoading = signal(false);

  constructor() {
    this.filterForm = this.formBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      employeeId: [undefined],
      customerId: [undefined],
    });

    this.filterModel$ = forkJoin({
      user: this.userService.user$,
      employees: this.apiService.getEmployeeBaseList(),
      customers: this.apiService.getMinimalCustomerListDeploymentReports(),
    });

    this.listModel$ = combineLatest({ state: this.store, refresh: this.$onRefresh.pipe(startWith({})) }).pipe(
      map(({ state }) => {
        const queryFilter = {
          year: state.deploymentReportList.year,
          month: state.deploymentReportList.month,
          employeeId: state.deploymentReportList.employeeId,
          customerId: state.deploymentReportList.customerId,
          page: state.deploymentReportList.page,
        };
        this.filterForm.patchValue(queryFilter, { emitEvent: false });
        return queryFilter;
      }),
      debounceTime(250),
      switchMap((filter) =>
        this.documentRepository.getDeploymentReportsList(filter.year, filter.month, filter.page, filter.customerId, filter.employeeId).pipe(
          catchError(() => {
            this.toastrService.error('Die Liste mit Einsatznachweisen konnte nicht geladen werden');
            return [];
          })
        )
      )
    );

    this.filterForm.valueChanges.subscribe(() => {
      this.store.dispatch(DeploymentReportChangeFilterAction(this.filterForm.value));
    });
  }

  onDownloadReport(report: DeploymentReportListEntry) {
    this.documentRepository.getDeploymentReportDocument(report.year, report.month, report.customerId, report.clearanceType).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Einsatznachweis - ${report.customerName}.pdf`;
        link.click();
      },
      error: (error) => {
        this.toastrService.error(`Der Einsatznachweis konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
      },
    });
  }

  onDeleteDeploymentReport(report: DeploymentReportListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteReport(report));
    modalRef.componentInstance.title = 'Einsatznachweis löschen';
    modalRef.componentInstance.text = `Soll der Einsatznachweis ${this.clearanceTypeNamePipe.transform(report.clearanceType)} von ${
      report.customerName
    } für ${this.monthNamePipe.transform(report.month)} ${report.year} wirklich gelöscht werden?`;
  }

  onPageChanged($event: number) {
    this.store.dispatch(DeploymentReportChangePageAction({ page: $event }));
  }

  private deleteReport(report: DeploymentReportListEntry) {
    this.isLoading.set(true);
    this.documentRepository.deleteDeploymentReport(report.reportId).subscribe({
      next: () => {
        this.toastrService.success('Einsatznachweis wurde gelöscht');
        this.$onRefresh.next(true);
      },
      error: (error) => {
        this.toastrService.error(`Einsatznachweis konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }
}
