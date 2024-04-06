import { CommonModule, formatDate } from '@angular/common';
import { Component, type OnDestroy, inject, signal, TemplateRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { type Observable, Subject, combineLatest, map, mergeMap, of, takeUntil, tap } from 'rxjs';
import { InvoiceRepository } from '../invoice.repository';
import { RideCostsTypeNamePipe } from '@curacaru/pipes/ride-costs-type-name.pipe';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';
import { type DeploymentReportTime } from '@curacaru/models/deployment-report-time.model';
import { FormControl } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { Signature } from '@curacaru/shared/signature/signature.component';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { InvoiceAddModel } from '@curacaru/dashboard/invoices/models/invoice-add.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RideCostsTypeNamePipe, FontAwesomeModule, RouterModule, Signature],

  standalone: true,
  selector: 'cura-invoices-editor',
  templateUrl: './invoices-editor.component.html',
})
export class InvoicesEditorComponent {
  /* injections */
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly documentRepository = inject(DocumentRepository);
  private readonly formsBuilder = inject(FormBuilder);
  private readonly invoiceRepository = inject(InvoiceRepository);
  private readonly offcanvasService = inject(NgbOffcanvas);
  private readonly router = inject(Router);
  private readonly toastrService = inject(ToastrService);
  private readonly userService = inject(UserService);

  /* relays */
  faCheck = faCheck;
  faCircleExclamation = faCircleExclamation;
  faCircleInfo = faCircleInfo;
  months = DateTimeService.months;
  rideCostsType = RideCostsType;

  /* properties */
  readonly invoiceForm;
  readonly isSaving = signal(false);
  readonly model$: Observable<any>;
  readonly rideCosts = signal(0);
  readonly totalDistance = signal(0);
  readonly totalDuration = signal(0);

  private reportId?: UUID;

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

    this.invoiceForm.valueChanges.subscribe(
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
          return of({ ...next, deploymentReport: undefined });
        }
      }),
      tap((next) => {
        this.reportId = next.deploymentReport?.reportId;
        if (next.deploymentReport != null) {
          this.totalDuration.set(next.deploymentReport.times.reduce((acc: number, time: DeploymentReportTime) => acc + time.duration, 0));
          if (next.company.rideCostsType === RideCostsType.FlatRate) {
            this.rideCosts.set(next.deploymentReport.times.length * next.company.rideCosts);
          } else if (next.company.rideCostsType === RideCostsType.Kilometer) {
            this.totalDistance.set(next.deploymentReport.times.reduce((acc: number, time: DeploymentReportTime) => acc + time.distance, 0));
            this.rideCosts.set(this.totalDistance() * next.company.rideCosts);
          }
        }
      })
    );
  }

  onSave(): void {
    this.isSaving.set(true);
    const model: InvoiceAddModel = {
      deploymentReportId: this.reportId!,
      invoiceDate: this.invoiceForm.controls.invoiceDate.value!,
      invoiceNumber: this.invoiceForm.controls.invoiceNumber.value!,
      signature: this.invoiceForm.controls.signature.value!,
    };

    this.invoiceRepository.addInvoice(model).subscribe({
      next: (next) => this.router.navigate(['dashboard/invoices/list']),
      error: (error) => {
        this.isSaving.set(false);
        this.toastrService.error(`Daten konnten nicht abgerufen werden: [${error.status}] ${error.error}`);
      },
    });
  }

  openOffCanvas(template: TemplateRef<any>) {
    this.offcanvasService.open(template, { position: 'bottom', panelClass: 'signature-panel' });
  }

  onSigned($event: string) {
    this.invoiceForm.controls.signature.setValue($event);
    this.offcanvasService.dismiss();
  }
}
