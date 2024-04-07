import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { InsuranceStatus } from '@curacaru/enums/insurance-status.enum';
import { Customer, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { FallbackSpacePipe } from '@curacaru/pipes/fallback-space.pipe';
import { ApiService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { SignatureComponent } from '@curacaru/shared/signature/signature.component';
import { ValidateTrue } from '@curacaru/validators/true.validator';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { NgbDatepickerModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, combineLatest, distinctUntilKeyChanged, filter, finalize, map, merge, mergeMap, of, startWith, tap } from 'rxjs';

@Component({
  imports: [
    AsyncPipe,
    CommonModule,
    ReactiveFormsModule,
    FallbackSpacePipe,
    RouterModule,
    FontAwesomeModule,
    SignatureComponent,
    NgbDatepickerModule,
  ],
  selector: 'cura-assignment-declaration-signature',
  standalone: true,
  templateUrl: './assignment-declaration-signature.component.html',
})
export class AssignmentDeclarationSignatureComponent {
  faCalendar = faCalendar;
  faInfoCircle = faInfoCircle;
  insuranceStatus = InsuranceStatus;

  readonly documentForm: FormGroup;
  readonly isSaving = signal(false);
  readonly dataModel$: Observable<{
    customers: MinimalCustomerListEntry[];
    customer?: Customer;
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
  private readonly offCanvasService = inject(NgbOffcanvas);

  constructor() {
    this.documentForm = this.formBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      customerId: [undefined, [Validators.required]],
      signature: [undefined],
      signatureCity: [undefined, [Validators.required, Validators.maxLength(30)]],
      isAccepted: [false, [ValidateTrue]],
    });

    this.documentForm.controls['year'].valueChanges.subscribe((year) => this.onSelectedYearChange(year));
    this.documentForm.controls['customerId'].valueChanges.subscribe((customerId) => this.onSelectedCustomerChange(customerId));

    const yearCombined$ = merge([this.documentForm.controls['year'].valueChanges.pipe(map((o) => +o)), of(this.today.getFullYear())]).pipe(
      mergeMap((o) => o),
      filter((year) => year >= 2020 && year < 2999)
    );

    const customers$ = yearCombined$.pipe(mergeMap((year) => this.apiService.getMinimalCustomerList(InsuranceStatus.Statutory, year)));

    const customer$ = this.activatedRoute.queryParams.pipe(
      distinctUntilKeyChanged('customer'),
      mergeMap((queryParams) => {
        this.documentForm.controls['customerId'].setValue(queryParams['customer'], { emitEvent: false });

        if (queryParams['year'] && queryParams['year'] != this.documentForm.controls['year'].value) {
          this.documentForm.controls['year'].setValue(queryParams['year'], { emitEvent: false });
        }

        return queryParams['customer'] ? this.apiService.getCustomer(queryParams['customer']) : of(undefined);
      }),
      startWith(undefined)
    );

    this.dataModel$ = combineLatest({ user: this.userService.user$, customers: customers$, customer: customer$ }).pipe(
      tap((result) => {
        if (result.customer && !result.customers.find((o) => o.customerId == result.customer?.id)) {
          this.documentForm.controls['customerId'].setValue(undefined);
        }
      })
    );
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offCanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSigned($event: string) {
    this.documentForm.controls['signature'].setValue($event);
    this.save();
  }

  private save() {
    this.isSaving.set(true);
    this.documentRepository
      .createAssignmentDeclaration(this.documentForm.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: (_) => {
          this.toasterService.success('Abtretungserklärung erfolgreich gespeichert');
          this.router.navigate(['/dashboard/documents/assignment-declarations'], {
            queryParams: { year: this.documentForm.value['year'], customer: this.documentForm.value['customerId'] },
          });
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
