import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { EmployeeBasic, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { AssignmentDeclarationListEntry } from '@curacaru/models/assignment-declaration-list-entry.model';
import { ApiService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faDownload, faGear } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, catchError, combineLatest, debounceTime, finalize, forkJoin, map, startWith, switchMap } from 'rxjs';

@Component({
  templateUrl: './assignment-declarations-list.component.html',
  imports: [RouterModule, AsyncPipe, FormsModule, ReactiveFormsModule, CommonModule, FontAwesomeModule],
  selector: 'cura-assignment-declarations',
  standalone: true,
})
export class AssignmentDeclarationsListComponent {
  faCalendar = faCalendar;
  faCircleInfo = faCircleInfo;
  faDownload = faDownload;
  faGear = faGear;
  faTrashCan = faTrashCan;
  faUser = faUser;

  readonly filterModel$: Observable<{
    customers: MinimalCustomerListEntry[];
    employees: EmployeeBasic[];
    user: UserEmployee;
  }>;
  readonly listModel$: Observable<AssignmentDeclarationListEntry[]>;
  readonly filterForm: FormGroup;
  readonly isLoading = signal(false);

  private readonly $onRefresh = new Subject();
  private readonly onRefresh$ = this.$onRefresh.asObservable();
  private readonly activeRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly modalService = inject(NgbModal);

  constructor() {
    this.filterForm = this.formBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      employeeId: [undefined],
      customerId: [undefined],
    });

    this.filterForm.controls['year'].valueChanges.subscribe((year) => this.onSelectedYearChange(year));
    this.filterForm.controls['customerId'].valueChanges.subscribe((customerId) => this.onSelectedCustomerChange(customerId));
    this.filterForm.controls['employeeId'].valueChanges.subscribe((employeeId) => this.onSelectedEmployeeChange(employeeId));

    this.filterModel$ = forkJoin({
      user: this.userService.user$,
      employees: this.apiService.getEmployeeBaseList(),
      customers: this.apiService.getMinimalCustomerList(InsuranceStatus.Statutory),
    });

    this.listModel$ = combineLatest({ _: this.onRefresh$.pipe(startWith(null)), queryParams: this.activeRoute.queryParams }).pipe(
      map(({ queryParams }) => {
        const queryFilter = {
          year: queryParams['year'] || new Date().getFullYear(),
          employeeId: queryParams['employee'] || undefined,
          customerId: queryParams['customer'] || undefined,
        };
        this.filterForm.patchValue(queryFilter, { emitEvent: false });
        return queryFilter;
      }),
      debounceTime(300),
      switchMap((filter) =>
        this.documentRepository.getAssignmentDeclarationList(filter.year, filter.customerId, filter.employeeId).pipe(
          catchError(() => {
            this.toastrService.error('Die Liste mit Abtretungserklärungen konnte nicht geladen werden');
            return [];
          })
        )
      )
    );
  }

  onDeleteAssignmentDeclaration(declaration: AssignmentDeclarationListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteReport(declaration));
    modalRef.componentInstance.title = 'Abtretungserklärung löschen';
    modalRef.componentInstance.text = `Soll die Abtretungserklärung von ${declaration.customerName} für ${declaration.year} wirklich gelöscht werden?`;
  }

  onDownloadAssignmentDeclaration(declaration: AssignmentDeclarationListEntry) {
    this.isLoading.set(true);
    this.documentRepository.getAssignmentDeclaration(declaration.customerId, declaration.year).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Abtretungserklärung ${declaration.year} - ${declaration.customerName}.pdf`;
        link.click();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastrService.error(`Abtretungserklärung konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`),
          this.isLoading.set(false);
      },
    });
  }

  onSelectedYearChange(selectedYear: string) {
    let year = +selectedYear || new Date().getFullYear();

    if (year >= 2020 && year < 2999) {
      this.router.navigate([], { queryParams: { year: year }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  onSelectedEmployeeChange(selectedEmployeeId: string) {
    this.router.navigate([], {
      queryParams: { employee: selectedEmployeeId == '' ? null : selectedEmployeeId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onSelectedCustomerChange(selectedCustomerId: string) {
    this.router.navigate([], {
      queryParams: { customer: selectedCustomerId == '' ? null : selectedCustomerId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private deleteReport(report: AssignmentDeclarationListEntry) {
    this.isLoading.set(true);
    this.documentRepository.deleteAssignmentDeclaration(report.assignmentDeclarationId).subscribe({
      next: () => {
        this.toastrService.success('Abtretungserklärung wurde gelöscht');
        this.$onRefresh.next(true);
      },
      error: (error) => {
        this.toastrService.error(`Abtretungserklärung konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }
}
