import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CustomerListEntry } from '@curacaru/models';
import { Page } from '@curacaru/models/page.model';
import { ApiService, ErrorHandlerService, ScreenService } from '@curacaru/services';
import { Subject, combineLatest, mergeMap, startWith, takeUntil, tap } from 'rxjs';
import { ChangePageAction, ProspectListState } from './prospect-list.state';
import { Store } from '@ngrx/store';
import { CustomerStatus } from '@curacaru/enums/customer-status.enum';
import { RouterModule } from '@angular/router';
import { ProspectListEntryComponent } from '../prospect-list-entry/prospect-list-entry.component';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';
import { LoaderCardComponent } from '@curacaru/shared/loader-card/loader-card.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { InfoComponent } from '../../../../shared/info-box/info.component';

@Component({
  selector: 'cura-prospect-list',
  standalone: true,
  templateUrl: './prospect-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ProspectListEntryComponent, ProspectListEntryComponent, PagingComponent, LoaderCardComponent, InfoComponent],
})
export class ProspectListComponent implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly modalService = inject(NgbModal);
  private readonly screenService = inject(ScreenService);

  private readonly store = inject(Store<ProspectListState>);

  private $onRefresh = new Subject<void>();
  private $onDestroy = new Subject<void>();

  isLoading = signal(true);
  isMobile = this.screenService.isMobile;
  page = signal<Page<CustomerListEntry> | undefined>(undefined);

  ngOnDestroy(): void {
    this.$onDestroy.next();
    this.$onDestroy.complete();
  }

  ngOnInit(): void {
    combineLatest({
      refresh: this.$onRefresh.pipe(startWith({})),
      state: this.store,
    })
      .pipe(
        takeUntil(this.$onDestroy),
        tap(() => this.isLoading.set(true)),
        mergeMap((o) => this.apiService.getCustomerList(o.state.prospectList.page, CustomerStatus.Interested, undefined, 'date'))
      )
      .subscribe({
        next: (o) => {
          this.page.set(o);
          this.isLoading.set(false);
        },
        error: (e) => {
          this.errorHandlerService.handleError(e);
          this.isLoading.set(false);
        },
      });
  }

  onDelete(customer: CustomerListEntry) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteCustomer(customer));
    modalRef.componentInstance.title = 'Interessenten löschen';
    modalRef.componentInstance.text = `Soll ${customer.firstName} ${customer.lastName} wirklich gelöscht werden? Die Löschung ist endgültig und kann nicht rückgängig gemacht werden.`;
  }

  private deleteCustomer(customer: CustomerListEntry) {
    if (this.isLoading()) return;
    this.isLoading.set(true);

    this.apiService.deleteProspect(customer.id).subscribe({
      next: () => {
        this.$onRefresh.next();
      },
      error: (e) => {
        this.errorHandlerService.handleError(e);
        this.isLoading.set(false);
      },
    });
  }

  onPageChange($event: number) {
    this.store.dispatch(ChangePageAction({ page: $event }));
  }
}
