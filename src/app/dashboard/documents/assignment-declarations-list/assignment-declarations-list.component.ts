import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { EmployeeBasic, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { AssignmentDeclarationListEntry } from '@curacaru/models/assignment-declaration-list-entry.model';
import { ApiService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { AssignmentDeclarationListChangeFilterAction } from '@curacaru/state/assignment-declaration-list.state';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar, faTrashCan, faUser } from '@fortawesome/free-regular-svg-icons';
import { faCircleInfo, faDownload, faGear } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, catchError, combineLatest, debounceTime, forkJoin, map, startWith, switchMap, takeUntil } from 'rxjs';

@Component({
  templateUrl: './assignment-declarations-list.component.html',
  imports: [RouterModule, AsyncPipe, FormsModule, ReactiveFormsModule, CommonModule, FontAwesomeModule],
  selector: 'cura-assignment-declarations',
  standalone: true,
})
export class AssignmentDeclarationsListComponent implements OnDestroy {
  faCalendar = faCalendar;
  faCircleInfo = faCircleInfo;
  faDownload = faDownload;
  faGear = faGear;
  faTrashCan = faTrashCan;
  faUser = faUser;

  readonly filterModel$: Observable<{
    employees: EmployeeBasic[];
    user: UserEmployee;
  }>;
  readonly listModel$: Observable<AssignmentDeclarationListEntry[]>;
  readonly filterForm: FormGroup;
  readonly isLoading = signal(false);

  private readonly $onRefresh = new Subject();
  private readonly apiService = inject(ApiService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly modalService = inject(NgbModal);
  private readonly onRefresh$ = this.$onRefresh.asObservable();
  private readonly router = inject(Router);
  private readonly store = inject(Store);
  private readonly toastrService = inject(ToastrService);
  private readonly userService = inject(UserService);

  private destroyed$ = new Subject();

  constructor() {
    this.filterForm = this.formBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      employeeId: [undefined],
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe((filter) => {
      this.store.dispatch(AssignmentDeclarationListChangeFilterAction(filter));
    });

    this.filterModel$ = forkJoin({
      user: this.userService.user$,
      employees: this.apiService.getEmployeeBaseList(),
    });

    this.listModel$ = combineLatest({ _: this.onRefresh$.pipe(startWith(null)), state: this.store }).pipe(
      map(({ state }) => {
        const queryFilter = {
          year: state.assignmentDeclarationList.year,
          employeeId: state.assignmentDeclarationList.employeeId,
        };
        this.filterForm.patchValue(queryFilter, { emitEvent: false });
        return queryFilter;
      }),
      debounceTime(300),
      switchMap((filter) =>
        this.documentRepository.getAssignmentDeclarationList(filter.year, filter.employeeId).pipe(
          catchError(() => {
            this.toastrService.error('Die Liste mit Abtretungserklärungen konnte nicht geladen werden');
            return [];
          })
        )
      )
    );
  }
  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.complete();
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
