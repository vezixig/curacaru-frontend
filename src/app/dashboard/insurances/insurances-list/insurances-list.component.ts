import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear, faHouse, faKey } from '@fortawesome/free-solid-svg-icons';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons';
import { RouterModule } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalConfirm } from '../../../modals/confirm-modal/confirm-modal.component';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, EMPTY, Subscription, catchError, finalize } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Insurance } from '../../../models/insurance.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FontAwesomeModule, RouterModule, NgxSkeletonLoaderModule],
  providers: [ApiService],
  selector: 'cura-insurances-list',
  standalone: true,
  templateUrl: './insurances-list.component.html',
})
export class InsurancesListComponent implements OnDestroy, OnInit {
  faGear = faGear;
  faKey = faKey;
  faHouse = faHouse;
  faTrashCan = faTrashCan;

  private isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  private insurances = new BehaviorSubject<Insurance[]>([]);
  insurances$ = this.insurances.asObservable();

  private deleteInsuranceSubscription?: Subscription;
  private getInsurancesSubscription?: Subscription;

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.getInsurancesSubscription = this.apiService
      .getInsuranceList()
      .pipe(
        catchError((error) => {
          this.toastr.error(`Versicherungsliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
          return EMPTY;
        }),
        finalize(() => this.isLoading.next(false))
      )
      .subscribe((insurances) => this.insurances.next(insurances));
  }

  ngOnDestroy(): void {
    this.getInsurancesSubscription?.unsubscribe();
    this.deleteInsuranceSubscription?.unsubscribe();
  }

  handleDelete(insurance: Insurance) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteInsurance(insurance));
    modalRef.componentInstance.title = 'Versicherung löschen';
    modalRef.componentInstance.text = `Soll die ${insurance.name} wirklich gelöscht werden?`;
  }

  private deleteInsurance(insurance: Insurance) {
    this.deleteInsuranceSubscription?.unsubscribe();
    this.deleteInsuranceSubscription = this.apiService.deleteInsurance(insurance.id!).subscribe({
      complete: () => {
        this.toastr.success(`${insurance.name} wurde gelöscht.`);
        this.insurances.next(this.insurances.value.filter((e) => e.id !== insurance.id));
      },
      error: (error) => this.toastr.error(`Versicherung konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    });
  }
}
