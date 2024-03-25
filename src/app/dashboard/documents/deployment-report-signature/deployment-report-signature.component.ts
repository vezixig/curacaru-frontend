import { CommonModule } from '@angular/common';
import { Component, TemplateRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClearanceType } from '@curacaru/enums/clearance-type';
import { Customer, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { DeploymentReport } from '@curacaru/models/deployment-report-view.model';
import { TimeFormatPipe } from '@curacaru/pipes/time.pipe';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { Signature } from '@curacaru/shared/signature/signature.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faCircleInfo, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, debounceTime, filter, forkJoin, map, mergeMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'deployment-report-signature',
  imports: [ReactiveFormsModule, CommonModule, TimeFormatPipe, FontAwesomeModule, Signature, RouterModule],
  standalone: true,
  templateUrl: './deployment-report-signature.component.html',
})
export class DeploymentReportSignatureComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);

  private readonly destroy$ = new Subject<void>();

  months = DateTimeService.months;
  today = DateTimeService.today;
  faCircleInfo = faCircleInfo;
  faCheck = faCheck;
  faExclamationTriangle = faExclamationTriangle;

  readonly dataModel$: Observable<{
    document?: DeploymentReport;
    customer: Customer;
    user: UserEmployee;
  }>;

  readonly documentForm: FormGroup;
  readonly filterModel$: Observable<{
    customers: MinimalCustomerListEntry[];
  }>;

  constructor() {
    this.documentForm = this.formBuilder.group({
      customerId: ['', Validators.required],
      clearanceType: [ClearanceType.selfPayment, Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      signatureEmployee: ['', [Validators.required]],
      signatureCustomer: ['', [Validators.required]],
      signatureCity: ['', [Validators.required]],
      canSign: [false, Validators.requiredTrue],
    });

    this.documentForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() =>
      this.router.navigate([], {
        queryParams: {
          year: this.documentForm.controls['year'].value,
          month: this.documentForm.controls['month'].value,
          customerId: !this.documentForm.controls['customerId'].value ? undefined : this.documentForm.controls['customerId'].value,
          clearanceType: this.documentForm.controls['clearanceType'].value,
        },
        queryParamsHandling: 'merge',
      })
    );

    this.filterModel$ = this.apiService.getMinimalCustomerList().pipe(map((customers) => ({ customers })));

    this.dataModel$ = combineLatest({ filter: this.filterModel$, queryParams: this.activatedRoute.queryParams, user: this.userService.user$ }).pipe(
      tap((next) => {
        this.documentForm.controls['year'].setValue(next.queryParams['year'] || new Date().getFullYear(), { emitEvent: false });
        this.documentForm.controls['month'].setValue(next.queryParams['month'] || new Date().getMonth() + 1, { emitEvent: false });
        this.documentForm.controls['customerId'].setValue(next.queryParams['customerId'], { emitEvent: false });
        if (next.queryParams['clearanceType']) {
          this.documentForm.controls['clearanceType'].setValue(next.queryParams['clearanceType'], { emitEvent: false });
        }
      }),
      filter((next) => next.queryParams['customerId'] != undefined),
      debounceTime(300),
      mergeMap((next) =>
        forkJoin({
          customer: this.apiService.getCustomer(next.queryParams['customerId']).pipe(),
          document: this.documentRepository.getDeploymentReport(
            next.queryParams['year'],
            next.queryParams['month'],
            next.queryParams['customerId'],
            next.queryParams['clearanceType']
          ),
        }).pipe(map((result) => ({ ...result, user: next.user })))
      )
    );
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSave() {
    if (this.documentForm.invalid) {
      return;
    }

    this.documentRepository.saveDeploymentReport(this.documentForm.value).subscribe({
      next: () =>
        this.router.navigate(['dashboard', 'documents', 'deployment-reports'], {
          queryParams: { year: this.documentForm.value['year'], month: this.documentForm.value['month'] },
        }),
      error: (error) => {
        this.toastrService.error(`Der Einsatznachweis konnte nicht gespeichert werden [${error.status}] ${error.error}`);
      },
    });
  }

  onEmployeeSigned($event: string) {
    this.documentForm.controls['signatureEmployee'].setValue($event);
    this.offcanvasService.dismiss();
  }

  onCustomerSigned($event: string) {
    this.documentForm.controls['signatureCustomer'].setValue($event);
    this.offcanvasService.dismiss();
  }
}
