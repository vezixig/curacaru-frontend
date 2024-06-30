import { AsyncPipe, CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MinimalCustomerListEntry, UserEmployee } from '@curacaru/models';
import { ApiService, DateTimeService, UserService } from '@curacaru/services';
import { Store } from '@ngrx/store';
import { Observable, Subject, combineLatest, map, startWith, switchMap, tap } from 'rxjs';
import { InvoiceRepository } from '../invoice.repository';
import { InvoiceListEntry } from '../models/invoice-list-entry.model';
import { InvoiceChangePageAction, InvoicesChangeFilterAction, InvoicesListState } from '@curacaru/state/invoices-list.state';
import { faCircleInfo, faDownload, faGear, faHashtag, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MonthNamePipe } from '@curacaru/pipes/month-name.pipe';
import { ClearanceTypeNamePipe } from '@curacaru/pipes/clarance-type-name.pipe';
import { ToastrService } from 'ngx-toastr';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { UUID } from 'angular2-uuid';
import { faCalendar, faUser } from '@fortawesome/free-regular-svg-icons';
import { Page } from '@curacaru/models/page.model';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';

@Component({
  selector: 'curacaru-invoices-list',
  templateUrl: './invoices-list.component.html',
  standalone: true,
  imports: [AsyncPipe, ClearanceTypeNamePipe, CommonModule, FontAwesomeModule, MonthNamePipe, ReactiveFormsModule, RouterModule, PagingComponent],
})
export class InvoicesListComponent {
  /** injections */
  private readonly store = inject(Store<InvoicesListState>);
  private readonly apiService = inject(ApiService);
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly invoiceRepository = inject(InvoiceRepository);
  private readonly toastrService = inject(ToastrService);
  private readonly modalService = inject(NgbModal);

  /** Relays */
  faCalendar = faCalendar;
  faCircleInfo = faCircleInfo;
  faDownload = faDownload;
  faGear = faGear;
  faHashtag = faHashtag;
  faTrashCan = faTrashCan;
  faUser = faUser;
  months = DateTimeService.months;

  /** Properties */
  readonly model$: Observable<{ user: UserEmployee; customers: MinimalCustomerListEntry[]; invoices: Page<InvoiceListEntry> }>;
  readonly filterForm: FormGroup;
  readonly isLoading = signal(false);

  /** fields */
  private readonly $onRefresh = new Subject<boolean>();

  constructor() {
    this.filterForm = this.formBuilder.group({
      year: [[Validators.required, Validators.min(2020), Validators.max(2999)]],
      month: [[Validators.required, Validators.min(1), Validators.max(12)]],
      customerId: [],
    });

    this.filterForm.valueChanges.subscribe((filter) => {
      this.store.dispatch(InvoicesChangeFilterAction(filter));
    });

    this.model$ = combineLatest({
      user: this.userService.user$,
      customers: this.apiService.getMinimalCustomerList(),
      state: this.store,
      refresh: this.$onRefresh.pipe(startWith(true)),
    }).pipe(
      tap((result) => this.filterForm.patchValue(result.state.invoicesList, { emitEvent: false })),
      switchMap((result) =>
        this.invoiceRepository
          .getInvoiceList(
            result.state.invoicesList.year,
            result.state.invoicesList.month,
            result.state.invoicesList.page,
            result.state.invoicesList.customerId
          )
          .pipe(map((invoices) => ({ user: result.user, customers: result.customers, invoices })))
      )
    );
  }

  onDownloadInvoice(invoice: InvoiceListEntry) {
    if (!invoice.invoiceId) return;
    this.isLoading.set(true);

    this.invoiceRepository.getInvoiceDocument(invoice.invoiceId).subscribe({
      next: (result) => {
        const blob = new Blob([result], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = `Rechnung ${invoice.invoiceNumber}.pdf`;
        link.click();
        this.isLoading.set(false);
      },
      error: (error) => {
        this.toastrService.error(`Die Rechnung konnte nicht heruntergeladen werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }

  onDeleteInvoice(invoice: InvoiceListEntry) {
    if (!invoice.invoiceId) return;

    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteInvoice(invoice.invoiceId!));
    modalRef.componentInstance.title = 'Rechnung löschen';
    modalRef.componentInstance.text = `Soll die Rechnung ${invoice.invoiceNumber} wirklich gelöscht werden?`;
  }

  onPageChange($event: number) {
    this.store.dispatch(InvoiceChangePageAction({ page: $event }));
  }

  private deleteInvoice(invoiceId: UUID) {
    this.isLoading.set(true);
    this.invoiceRepository.deleteInvoice(invoiceId).subscribe({
      next: () => {
        this.toastrService.success('Rechnung wurde gelöscht');
        this.$onRefresh.next(true);
      },
      error: (error) => {
        this.toastrService.error(`Rechnung konnte nicht gelöscht werden: [${error.status}] ${error.error}`);
        this.isLoading.set(false);
      },
    });
  }
}
