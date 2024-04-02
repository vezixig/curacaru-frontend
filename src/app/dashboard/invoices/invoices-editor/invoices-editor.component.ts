import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { Observable, Subject, combineLatest, debounce, debounceTime, filter, forkJoin, map, mergeMap, of, takeUntil, tap } from 'rxjs';
import { InvoiceRepository } from '../invoice.repository';
import { RideCostsTypeNamePipe } from '@curacaru/pipes/ride-costs-type-name.pipe';
import { RideCostsType } from '@curacaru/enums/ride-cost-type.enum';
import { DocumentRepository } from '@curacaru/services/repositories/document.repository';

@Component({
  imports: [ReactiveFormsModule, CommonModule, RideCostsTypeNamePipe],
  standalone: true,
  selector: 'cura-invoices-editor',
  templateUrl: './invoices-editor.component.html',
})
export class InvoicesEditorComponent implements OnDestroy {
  private readonly formsBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly apiService = inject(ApiService);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly invoiceRepository = inject(InvoiceRepository);
  private readonly documentRepository = inject(DocumentRepository);

  months = DateTimeService.months;
  rideCostsType = RideCostsType;

  readonly invoiceForm: FormGroup;
  model$: Observable<any>;

  private readonly destroy$ = new Subject();

  constructor() {
    this.invoiceForm = this.formsBuilder.group({
      year: [new Date().getFullYear(), [Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
      customerId: [undefined, [Validators.required]],
      clearanceType: [undefined, [Validators.required]],
      invoiceNumber: ['', [Validators.required]],
      invoiceDate: [new Date(), [Validators.required]],
    });

    this.invoiceForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() =>
      this.router.navigate([], {
        queryParams: {
          year: this.invoiceForm.controls['year'].value,
          month: this.invoiceForm.controls['month'].value,
          customerId: !this.invoiceForm.controls['customerId'].value ? undefined : this.invoiceForm.controls['customerId'].value,
          clearanceType: this.invoiceForm.controls['clearanceType'].value,
        },
        queryParamsHandling: 'merge',
      })
    );

    this.model$ = combineLatest({
      user: this.userService.user$,
      customers: this.apiService.getMinimalCustomerList(),
      company: this.apiService.getCompanyPrices(),
      queryParams: this.activatedRoute.queryParams.pipe(debounceTime(300)),
    }).pipe(
      tap((next) => {
        if (next.queryParams['year'] && next.queryParams['year'] != this.invoiceForm.controls['year']?.value) {
          this.invoiceForm.controls['year']?.setValue(next.queryParams['year']);
        }
        if (next.queryParams['month'] && next.queryParams['month'] != this.invoiceForm.controls['month']?.value) {
          this.invoiceForm.controls['month']?.setValue(next.queryParams['month']);
        }
        if (next.queryParams['customerId'] && next.queryParams['customerId'] != this.invoiceForm.controls['customerId']?.value) {
          this.invoiceForm.controls['customerId']?.setValue(next.queryParams['customerId']);
        }
        if (next.queryParams['clearanceType'] && next.queryParams['clearanceType'] != this.invoiceForm.controls['clearanceType']?.value) {
          this.invoiceForm.controls['clearanceType']?.setValue(next.queryParams['clearanceType']);
        }
      }),  
      mergeMap((next) => {
        if(next.queryParams['customerId'] && next.queryParams['clearanceType']) {
        return this.documentRepository
          .getDeploymentReport(   
            this.invoiceForm.controls['year'].value,
            this.invoiceForm.controls['month'].value, 
            this.invoiceForm.controls['customerId'].value,
            this.invoiceForm.controls['clearanceType'].value
          ) 
          .pipe(map((deploymentReport) => ({ ...next, deploymentReport: deploymentReport })))
          
        } else {
          console.log('no customer or clearance type')
          return of({...next, deploymentReport: {}});
        }
      }     ),
      tap((next) => console.log(next))
    );
  }
  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  onSave() {
    alert('SAVE');
  }
}
