import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { routes } from '@curacaru/app.routes';
import { CustomerListEntry, EmployeeBasic, MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, forkJoin, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs';
import { InvoiceRepository } from '../invoice.repository';
import { InvoiceListEntry } from '../models/invoice-list-entry';
import { InvoicesChangeFilterAction } from '@curacaru/state/invoices-list.state';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { ClearanceTypeNamePipe } from '@curacaru/pipes/clarance-type-name.pipe';

@Component({
  imports: [AsyncPipe, ClearanceTypeNamePipe, CommonModule, FontAwesomeModule, MonthNamePipe, ReactiveFormsModule, RouterModule],
  selector: 'curacaru-invoices-list',
  templateUrl: './invoices-list.component.html',
  standalone: true,
})
export class InvoicesListComponent implements OnDestroy {
  /** injections */
  private readonly store = inject(Store);
  private readonly apiService = inject(ApiService);
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly invoiceRepository = inject(InvoiceRepository);

  /** Relays */
  faGear = faGear;
  months = DateTimeService.months;

  /** Properties */
  readonly model$: Observable<{ user: UserEmployee; customers: MinimalCustomerListEntry[]; invoices: InvoiceListEntry[] }>;
  readonly filterForm: FormGroup;

  /** fields */
  private readonly $destroy = new Subject();

  constructor() {
    this.filterForm = this.formBuilder.group({
      year: [[Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [[Validators.required, Validators.min(1), Validators.max(12)]],
      customerId: [],
    });

    this.filterForm.valueChanges.pipe(takeUntil(this.$destroy)).subscribe((filter) => {
      this.store.dispatch(InvoicesChangeFilterAction(filter));
    });

    this.model$ = combineLatest({
      user: this.userService.user$,
      customers: this.apiService.getMinimalCustomerList(),
      state: this.store,
    }).pipe(
      tap((result) => this.filterForm.patchValue(result.state.invoicesList, { emitEvent: false })),
      switchMap((result) =>
        this.invoiceRepository
          .getInvoiceList(result.state.invoicesList.year, result.state.invoicesList.month)
          .pipe(map((invoices) => ({ user: result.user, customers: result.customers, invoices })))
      )
    );
  }

  ngOnDestroy() {
    this.$destroy.next(true);
    this.$destroy.complete();
  }
}
