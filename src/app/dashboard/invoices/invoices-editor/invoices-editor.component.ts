import { CommonModule, formatDate } from '@angular/common';
import { Component, type OnDestroy, inject, signal, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { type Observable, Subject, combineLatest, map, mergeMap, of, takeUntil, tap } from 'rxjs';
import { InvoiceRepository } from '../invoice.repository';
import { RideCostsTypeNamePipe } from '@curacaru/pipes/ride-costs-type-name.pipe';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { type DeploymentReportTime } from '@curacaru/models/deployment-report-time.model';
import { FormControl } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Signature } from '@curacaru/shared/signature/signature.component';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RideCostsTypeNamePipe, FontAwesomeModule, Signature],

  standalone: true,
  selector: 'cura-invoices-editor',
  templateUrl: './invoices-editor.component.html',
})
export class InvoicesEditorComponent implements OnDestroy {
  private readonly formsBuilder = inject<FormBuilder>(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly invoiceRepository = inject(InvoiceRepository);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly offcanvasService = inject(NgbOffcanvas);

  faCircleInfo = faCircleInfo;
  totalDistance = signal(0);
  totalDuration = signal(0);
  rideCosts = signal(0);

  months = DateTimeService.months;
  rideCostsType = RideCostsType;

  readonly invoiceForm;
  model$: Observable<any>;

  private readonly destroy$ = new Subject();

  constructor() {
    this.invoiceForm = this.formsBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      customerId: new FormControl<string>('', [Validators.required]),
      clearanceType: [undefined, [Validators.required]],
      invoiceNumber: ['', [Validators.required]],
      invoiceDate: [formatDate(new Date(), 'yyyy-MM-dd', 'de'), [Validators.required]],
      signature: ['', [Validators.required]],
    });

    this.invoiceForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(
      async () =>
        await this.router.navigate([], {
          queryParams: {
            year: this.invoiceForm.controls.year.value,
            month: this.invoiceForm.controls.month.value,
            customerId: !this.invoiceForm.controls.customerId.value ? undefined : this.invoiceForm.controls.customerId.value,
            clearanceType: this.invoiceForm.controls.clearanceType.value,
          },
          queryParamsHandling: 'merge',
        })
    );

    this.invoiceRepository.getNextInvoiceNumber().subscribe((next) => {
      this.invoiceForm.controls.invoiceNumber.setValue(next.invoiceNumber, { emitEvent: false });
    });

    this.model$ = combineLatest({
      user: this.userService.user$,
      customers: this.apiService.getMinimalCustomerList(),
      company: this.apiService.getCompanyPrices(),
      queryParams: this.activatedRoute.queryParams,
    }).pipe(
      tap((next) => {
        if (next.queryParams['year'] && next.queryParams['year'] != this.invoiceForm.controls.year?.value) {
          this.invoiceForm.controls.year?.setValue(next.queryParams['year']);
        }
        if (next.queryParams['month'] && next.queryParams['month'] != this.invoiceForm.controls.month?.value) {
          this.invoiceForm.controls.month?.setValue(next.queryParams['month']);
        }
        if (next.queryParams['customerId'] && next.queryParams['customerId'] != this.invoiceForm.controls['customerId']?.value) {
          this.invoiceForm.controls['customerId']?.setValue(next.queryParams['customerId']);
        }
        if (next.queryParams['clearanceType'] && next.queryParams['clearanceType'] != this.invoiceForm.controls.clearanceType?.value) {
          this.invoiceForm.controls.clearanceType?.setValue(next.queryParams['clearanceType']);
        }
      }),
      mergeMap((next) => {
        if (this.invoiceForm.controls.customerId.value && this.invoiceForm.controls.clearanceType.value) {
          return this.documentRepository
            .getDeploymentReport(
              this.invoiceForm.controls.year.value!,
              this.invoiceForm.controls.month.value!,
              this.invoiceForm.controls.customerId.value,
              this.invoiceForm.controls.clearanceType.value
            )
            .pipe(map((deploymentReport) => ({ ...next, deploymentReport })));
        } else {
          return of({ ...next, deploymentReport: null });
        }
      }),
      tap((next) => {
        if (next.deploymentReport != null) {
          this.totalDuration.set(next.deploymentReport.times.reduce((acc: number, time: DeploymentReportTime) => acc + time.duration, 0));
          this.totalDistance.set(next.deploymentReport.times.reduce((acc: number, time: DeploymentReportTime) => acc + time.distance, 0));
          if (next.company.rideCostsType === RideCostsType.FlatRate) {
            this.rideCosts.set(next.deploymentReport.times.length * next.company.rideCosts);
          } else if (next.company.rideCostsType === RideCostsType.Kilometer) {
            this.rideCosts.set(this.totalDistance() * next.company.rideCosts);
          }
        }
      })
    );
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onSave(): void {
    console.log(this.invoiceForm.value);
    alert('SAVE');
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSigned($event: string) {
    this.invoiceForm.controls.signature.setValue($event);
    this.offcanvasService.dismiss();
  }
}
