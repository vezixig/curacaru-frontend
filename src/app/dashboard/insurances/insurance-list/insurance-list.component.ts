import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faGear } from '@fortawesome/free-solid-svg-icons';
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
  selector: 'cura-insurance-list',
  standalone: true,
  templateUrl: './insurance-list.component.html',
})
export class InsuranceListComponent implements OnDestroy {
  faGear = faGear;
  faTrashCan = faTrashCan;

  private isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  insurances$? = this.apiService.getInsuranceList().pipe(
    catchError((error) => {
      this.toastr.error(`Versicherungsliste konnte nicht abgerufen werden: [${error.status}] ${error.error}`);
      return EMPTY;
    }),
    finalize(() => this.isLoading.next(false))
  );

  private deleteEmployeeSubscription?: Subscription;

  constructor(private apiService: ApiService, private modalService: NgbModal, private toastr: ToastrService) {}

  ngOnDestroy(): void {
    this.deleteEmployeeSubscription?.unsubscribe();
  }

  handleDelete(insurance: Insurance) {
    const modalRef = this.modalService.open(NgbdModalConfirm);
    modalRef.result.then(() => this.deleteInsurance(insurance));
    modalRef.componentInstance.title = 'Versicherung löschen';
    modalRef.componentInstance.text = `Soll die ${insurance.name} wirklich gelöscht werden?`;
  }

  private deleteInsurance(insurance: Insurance) {
    // this.deleteEmployeeSubscription?.unsubscribe();
    // this.deleteEmployeeSubscription = this.apiService.deleteEmployee(employee.id).subscribe({
    //   complete: () => {
    //     this.toastr.success(`${employee.firstName} ${employee.lastName} wurde gelöscht.`);
    //     this.employees = this.employees.filter((e) => e.id !== employee.id);
    //   },
    //   error: (error) => this.toastr.error(`Mitarbeiter konnte nicht gelöscht werden: [${error.status}] ${error.error}`),
    // });
  }
}
