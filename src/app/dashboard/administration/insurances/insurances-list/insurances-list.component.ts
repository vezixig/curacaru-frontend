import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear, faHouse, faKey } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import {
  BehaviorSubject,
  EMPTY,
  Observable,
  Subject,
  Subscription,
  catchError,
  combineLatest,
  debounceTime,
  mergeMap,
  startWith,
  takeUntil,
  tap,
} from 'rxjs';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Store } from '@ngrx/store';
import { ChangePageAction, InsurancesListState } from '@curacaru/state/insurances-list.state';
import { Page } from '@curacaru/models/page.model';
import { NgbdModalConfirm } from '@curacaru/modals/confirm-modal/confirm-modal.component';
import { Insurance } from '@curacaru/models';
import { ApiService } from '@curacaru/services';
import { PagingComponent } from '@curacaru/shared/paging/paging.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ApiService],
  selector: 'cura-insurances-list',
  standalone: true,
  templateUrl: './insurances-list.component.html',
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule, PagingComponent],
})
export class InsurancesListComponent implements OnDestroy {
  faGear = faGear;
  faKey = faKey;
  faHouse = faHouse;
  faTrashCan = faTrashCan;

  private isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  insurances$: Observable<Page<Insurance>>;

  private deleteInsuranceSubscription?: Subscription;
  private refresh$ = new Subject<void>();
  private destroy$ = new Subject<void>();

  private readonly store = inject(Store<InsurancesListState>);

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService) {
    this.insurances$ = combineLatest({ state: this.store, refresh: this.refresh$.pipe(startWith({})) }).pipe(
      debounceTime(300),
      takeUntil(this.destroy$),
      tap(() => this.isLoading.next(true)),
      mergeMap((o) => this.apiService.getInsuranceList(o.state.insurancesList.page)),
      tap(() => this.isLoading.next(false)),
      catchError((error) => {
        this.toastr.error(`Versicherungsliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
        return EMPTY;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleDelete(insurance: Insurance) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteInsurance(insurance));
    modalRef.componentInstance.title = 'Versicherung löschen';
    modalRef.componentInstance.text = `Soll die ${insurance.name} wirklich gelöscht werden?`;
  }

  onPageChange($event: number) {
    this.store.dispatch(ChangePageAction({ page: $event }));
  }

  private deleteInsurance(insurance: Insurance) {
    this.deleteInsuranceSubscription?.unsubscribe();
    this.deleteInsuranceSubscription = this.apiService.deleteInsurance(insurance.id!).subscribe({
      complete: () => {
        this.toastr.success(`${insurance.name} wurde gelöscht.`);
        this.refresh$.next();
      },
      error: (error) => this.toastr.error(`Versicherung konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    });
  }
}
