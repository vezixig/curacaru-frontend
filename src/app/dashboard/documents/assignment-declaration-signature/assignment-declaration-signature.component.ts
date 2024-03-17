import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Customer, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { FallbackSpacePipe } from '@curacaru/pipes/fallback-space.pipe';
import { ApiService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { Signature } from '@curacaru/shared/signature/signature.component';
import { ValidateTrue } from '@curacaru/validators/true.validator';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, finalize, forkJoin, switchMap } from 'rxjs';

@Component({
  imports: [AsyncPipe, CommonModule, ReactiveFormsModule, FallbackSpacePipe, RouterModule, FontAwesomeModule, Signature, NgbDatepickerModule],
  selector: 'cura-assignment-declaration-signature',
  standalone: true,
  templateUrl: './assignment-declaration-signature.component.html',
})
export class AssignmentDeclarationSignatureComponent {
  @ViewChild('signature') signatureElement!: Signature;

  faCalendar = faCalendar;
  faInfoCircle = faInfoCircle;
  insuranceStatus = InsuranceStatus;

  readonly dataModel$: Observable<Customer>;
  readonly documentForm: FormGroup;
  readonly isSaving = signal(false);
  readonly filterModel$: Observable<{
    customers: MinimalCustomerListEntry[];
    user: UserEmployee;
  }>;
  readonly today: Date = new Date();

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toasterService = inject(ToastrService);
  private readonly userService = inject(UserService);
  private readonly $initialized = new Subject();

  constructor() {
    this.documentForm = this.formBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      customerId: [undefined, [Validators.required]],
      signature: [undefined],
      signatureCity: [undefined, [Validators.required]],
      isAccepted: [false, [ValidateTrue]],
    });

    this.documentForm.controls['year'].valueChanges.subscribe((year) => this.onSelectedYearChange(year));
    this.documentForm.controls['customerId'].valueChanges.subscribe((customerId) => this.onSelectedCustomerChange(customerId));

    this.filterModel$ = forkJoin({
      user: this.userService.user$,
      customers: this.apiService.getMinimalCustomerList(InsuranceStatus.Statutory),
    }).pipe(finalize(() => this.$initialized.next(true)));

    this.dataModel$ = combineLatest({ _: this.filterModel$, queryParams: this.activatedRoute.queryParams }).pipe(
      switchMap(({ queryParams }) => {
        this.documentForm.controls['year'].setValue(queryParams['year'] || this.today.getFullYear());
        this.documentForm.controls['customerId'].setValue(queryParams['customer']);
        this.signatureElement?.clear();
        if (!queryParams['customer']) return [];

        return this.apiService.getCustomer(queryParams['customer']);
      })
    );
  }

  onSave() {
    if (this.signatureElement.isEmpty()) {
      this.toasterService.error('Bitte unterschreibe den Report');
      return;
    }

    this.documentForm.controls['signature'].setValue(this.signatureElement.toDataURL());
    this.isSaving.set(true);
    this.documentRepository
      .createAssignmentDeclaration(this.documentForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (_) => {
          this.toasterService.success('Abtretungserklärung erfolgreich gespeichert');
          this.router.navigate([
            '/dashboard/documents/assignment-declarations',
            { year: this.documentForm.value['year'], customer: this.documentForm.value['customerId'] },
          ]);
        },
        error: (error) => this.toasterService.error(`Abtretungserklärung konnte nicht erstellt werden: [${error.status}] ${error.error}`),
      });
  }

  onSelectedYearChange(selectedYear: string) {
    let year = +selectedYear || new Date().getFullYear();

    if (year >= 2020 && year < 2999) {
      this.router.navigate([], { queryParams: { year: year }, queryParamsHandling: 'merge', replaceUrl: true });
    }
  }

  onSelectedCustomerChange(selectedCustomerId: string) {
    this.router.navigate([], {
      queryParams: { customer: selectedCustomerId == '' ? null : selectedCustomerId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
